import re

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert confidence threshold back to 0.1 for ANPR to avoid missing plates
content = content.replace(
    "v_results = anpr_model(vehicle_crop, imgsz=640, conf=0.45, verbose=False)",
    "v_results = anpr_model(vehicle_crop, imgsz=640, conf=0.1, verbose=False)"
)

# Revert frame skipping from 15 back to 5 to process more frames and catch all plates
content = content.replace(
    "if frame_count % 15 == 0 or last_annotated_frame is None:",
    "if frame_count % 5 == 0 or last_annotated_frame is None:"
)
content = content.replace(
    "# Process full ANPR + OCR every 15 frames to maximize speed",
    "# Process full ANPR + OCR every 5 frames to maximize speed"
)

with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
