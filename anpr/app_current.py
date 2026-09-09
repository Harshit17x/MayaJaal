import gradio as gr
import cv2
import tempfile
import os
from ultralytics import YOLO
from hf_inference import HFInference
import numpy as np

# Load the highly reliable vehicle detection YOLOv8 model
model_path = r"yolov8s.pt"
model = YOLO(model_path)

# Load the dedicated ANPR YOLOv8 model for license plates
anpr_model = YOLO("anpr_model.pt")

# Initialize HF TrOCR reader
hf_reader = HFInference()

# Ensure our directory exists for saving plate snaps
os.makedirs("detected_plates", exist_ok=True)

def process_frame(image_bgr, return_snaps=False, seen_plates=None):
    # 1. Detect VEHICLES with the standard YOLO model (draws boxes on cars)
    results_vehicles = model(image_bgr, imgsz=640, conf=0.25, classes=[2, 3, 5, 7], verbose=False)
    
    # 2. Detect PLATES dynamically on the crops of detected vehicles
    # This solves the issue of missing small or tilted plates (like on motorcycles)
    # by focusing the ANPR model on the vehicle itself at high resolution.
    plate_boxes = []
    for vehicle_box in results_vehicles[0].boxes.xyxy:
        vx1, vy1, vx2, vy2 = map(int, vehicle_box[:4])
        
        # Add a small 10px margin around the vehicle crop
        h_img, w_img = image_bgr.shape[:2]
        vx1, vy1 = max(0, vx1 - 10), max(0, vy1 - 10)
        vx2, vy2 = min(w_img, vx2 + 10), min(h_img, vy2 + 10)
        
        vehicle_crop = image_bgr[vy1:vy2, vx1:vx2]
        if vehicle_crop.size == 0:
            continue
            
        # Run ANPR on the vehicle crop
        v_results = anpr_model(vehicle_crop, imgsz=640, conf=0.45, verbose=False)
        for p_box in v_results[0].boxes.xyxy:
            px1, py1, px2, py2 = map(int, p_box[:4])
            # Map crop coordinates back to full image coordinates
            plate_boxes.append([px1 + vx1, py1 + vy1, px2 + vx1, py2 + vy1])
    
    # Plot standard YOLO vehicle bounding boxes
    annotated_frame = results_vehicles[0].plot()
    snaps = []
    
    # Iterate over each perfectly detected License Plate
    for plate_box in plate_boxes:
        px1, py1, px2, py2 = map(int, plate_box[:4])
        
        # Ensure coordinates are within image bounds
        h, w = annotated_frame.shape[:2]
        
        # VERY IMPORTANT: Ensure we don't accidentally cut off letters on the edges
        # EasyOCR is much better at reading plates without needing inward crops.
        px1 = max(0, px1)
        px2 = min(w, px2)
        py1 = max(0, py1)
        py2 = min(h, py2)
        
        # Crop exactly to the naturally padded plate!
        plate_crop = image_bgr[py1:py2, px1:px2]
        if plate_crop.size == 0:
            continue
            
        # READ TEXT
        try:
            text_clean = hf_reader.predict(plate_crop)
        except Exception as e:
            text_clean = ""
        
        if text_clean:
            text = text_clean
            
            if len(text_clean) >= 4:
                if return_snaps and seen_plates is not None:
                    if text not in seen_plates:
                        seen_plates.add(text)
                        
                        # Save the pristine plate to local folder using the matched text
                        snap_path = os.path.join("detected_plates", f"plate_{text}.jpg")
                        cv2.imwrite(snap_path, plate_crop)
                        snaps.append((snap_path, text))
                
                # Draw text above the plate on the main image
                font_scale = max(0.6, (px2 - px1) / 150.0)
                thickness = max(1, int(font_scale * 2))
                (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
                cv2.rectangle(annotated_frame, (px1, py1 - th - 20), (px1 + tw + 10, py1 - 5), (0, 0, 0), -1)
                cv2.putText(annotated_frame, text, (px1 + 5, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)
                
    if return_snaps:
        return annotated_frame, snaps
    return annotated_frame

def predict_webcam(image, seen_plates, current_snaps):
    if image is None:
        return None, current_snaps, "", seen_plates, current_snaps
    
    # Handle RGBA images (Webcams on some browsers send 4 channels)
    if len(image.shape) == 3 and image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    annotated_frame, new_snaps = process_frame(image_bgr, return_snaps=True, seen_plates=seen_plates)
    
    # Add new snaps to the existing gallery list
    current_snaps.extend(new_snaps)
    
    res_image_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
    
    extracted_text = "\n".join(sorted(list(seen_plates)))
    
    # Return the updated frame and the gallery
    return res_image_rgb, current_snaps, extracted_text, seen_plates, current_snaps

def predict_image(image):
    if image is None:
        return None, [], ""
    
    seen_plates = set()
    
    # Handle RGBA images (Gradio sometimes passes 4 channels for PNGs or certain browser uploads)
    if len(image.shape) == 3 and image.shape[2] == 4:
        image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
    
    # Gradio passes an RGB image; YOLO expects BGR format
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    # Process frame (YOLO + TrOCR)
    annotated_frame, snaps = process_frame(image_bgr, return_snaps=True, seen_plates=seen_plates)
    
    # Convert back to RGB for Gradio UI
    res_image_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
    
    extracted_text = "\n".join(sorted(list(seen_plates)))
    
    return res_image_rgb, snaps, extracted_text

def predict_video(video_path, progress=gr.Progress()):
    if not video_path:
        return None, None, ""
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, None, ""
        
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps: # Handle NaN or 0
        fps = 30
        
    out_path = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False).name
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
    
    seen_plates = set()
    all_snaps = []
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_count = 0
    last_annotated_frame = None
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        if total_frames > 0 and frame_count % 10 == 0:
            progress(frame_count / total_frames, desc=f"Processing frame {frame_count}/{total_frames}")
            
        # Process full ANPR + OCR every 15 frames to maximize speed
        if frame_count % 15 == 0 or last_annotated_frame is None:
            annotated_frame, frame_snaps = process_frame(frame, return_snaps=True, seen_plates=seen_plates)
            all_snaps.extend(frame_snaps)
            last_annotated_frame = annotated_frame
        else:
            # Skip heavy YOLO processing entirely on intermediate frames
            annotated_frame = last_annotated_frame
            
        out.write(annotated_frame)
        
    cap.release()
    out.release()
    
    # Convert using imageio-ffmpeg to ensure browser compatibility
    import subprocess
    import imageio_ffmpeg
    final_out_path = out_path.replace(".mp4", "_h264.mp4")
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run([ffmpeg_exe, "-y", "-i", out_path, "-vcodec", "libx264", "-movflags", "faststart", final_out_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        video_to_return = final_out_path
    except Exception as e:
        print(f"Warning: ffmpeg conversion failed: {e}. Falling back to mp4v.")
        video_to_return = out_path
        
    extracted_text = "\n".join(sorted(list(seen_plates)))
    
    return video_to_return, all_snaps, extracted_text

with gr.Blocks(title="YOLOv8 Live Deployment + ANPR") as iface:
    gr.Markdown("# 🚀 YOLOv8 Universal Deployment + ANPR")
    gr.Markdown("Select a tab below to test with **Live Webcam**, **Image Upload**, or **Video Upload**. Now equipped with Hugging Face TrOCR for Automatic Number Plate Recognition!")
    
    with gr.Tab("Live Webcam"):
        gr.Markdown("Allow camera access to test real-time object detection directly from your device.")
        with gr.Row():
            webcam_input = gr.Image(sources=["webcam"], streaming=True, label="Live Webcam Stream")
            with gr.Column():
                webcam_output = gr.Image(type="numpy", label="Webcam Detections")
                webcam_text = gr.Textbox(label="📝 Clean Extracted Digits", lines=5)
                webcam_gallery = gr.Gallery(label="📸 Tightly Focused Plate Snapshots", show_label=True, elem_id="gallery_web", columns=[3], rows=[1], object_fit="contain", height="auto")
        
        # We need State variables to remember what we've seen during the live stream
        seen_state = gr.State(set())
        snaps_state = gr.State([])
        webcam_input.stream(fn=predict_webcam, inputs=[webcam_input, seen_state, snaps_state], outputs=[webcam_output, webcam_gallery, webcam_text, seen_state, snaps_state])
        
    with gr.Tab("Image Upload"):
        gr.Markdown("Upload a static image to detect objects and read number plates.")
        with gr.Row():
            image_input = gr.Image(sources=["upload"], type="numpy", label="Upload Image")
            with gr.Column():
                image_output = gr.Image(type="numpy", label="Image Detections")
                image_text = gr.Textbox(label="📝 Clean Extracted Digits", lines=5)
                image_gallery = gr.Gallery(label="📸 Extracted Plate Snapshots", show_label=True, elem_id="gallery_img", columns=[3], rows=[1], object_fit="contain", height="auto")
        image_button = gr.Button("Detect Objects & Read Plates")
        image_button.click(fn=predict_image, inputs=image_input, outputs=[image_output, image_gallery, image_text])
        
    with gr.Tab("Video Upload"):
        gr.Markdown("Upload a video file to process it frame-by-frame. Whenever a unique license plate is read, a tightly focused snapshot will be captured and displayed below!")
        with gr.Row():
            video_input = gr.Video(label="Upload Video")
            with gr.Column():
                video_output = gr.Video(label="Video Detections")
                video_text = gr.Textbox(label="📝 Clean Extracted Digits", lines=5)
                video_gallery = gr.Gallery(label="📸 Tightly Focused Plate Snapshots", show_label=True, elem_id="gallery_vid", columns=[3], rows=[1], object_fit="contain", height="auto")
        video_button = gr.Button("Process Video & Extract Plates")
        video_button.click(fn=predict_video, inputs=video_input, outputs=[video_output, video_gallery, video_text])

if __name__ == "__main__":
    iface.launch(server_name="0.0.0.0", server_port=7860, share=False)
