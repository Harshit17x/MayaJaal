import re

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update vehicle confidence to 0.50
content = content.replace(
    "results_vehicles = model(image_bgr, imgsz=640, conf=0.25, classes=[2, 3, 5, 7], verbose=False)",
    "results_vehicles = model(image_bgr, imgsz=640, conf=0.50, classes=[2, 3, 5, 7], verbose=False)"
)

# 2. Update loop to get vehicle_type
old_loop = """    for vehicle_box in results_vehicles[0].boxes.xyxy:
        vx1, vy1, vx2, vy2 = map(int, vehicle_box[:4])"""

new_loop = """    for vehicle_box in results_vehicles[0].boxes:
        vx1, vy1, vx2, vy2 = map(int, vehicle_box.xyxy[0][:4])
        vehicle_type = model.names[int(vehicle_box.cls[0])]"""
content = content.replace(old_loop, new_loop)

# 3. Update plate_boxes.append
old_append = "plate_boxes.append([px1 + vx1, py1 + vy1, px2 + vx1, py2 + vy1])"
new_append = "plate_boxes.append([px1 + vx1, py1 + vy1, px2 + vx1, py2 + vy1, vehicle_type])"
content = content.replace(old_append, new_append)

# 4. Update the plate_boxes loop to unpack vehicle_type
old_plate_loop = "    for plate_box in plate_boxes:\n        px1, py1, px2, py2 = map(int, plate_box[:4])"
new_plate_loop = "    for plate_box in plate_boxes:\n        px1, py1, px2, py2 = map(int, plate_box[:4])\n        vehicle_type = plate_box[4]"
content = content.replace(old_plate_loop, new_plate_loop)

# 5. Update snaps.append
old_snaps = 'snaps.append((snap_path, text))'
new_snaps = 'snaps.append((snap_path, f"{vehicle_type.upper()} - {text}"))'
content = content.replace(old_snaps, new_snaps)

# Also update the on-screen text to show vehicle type + plate
old_put_text = 'cv2.putText(annotated_frame, text, (px1 + 5, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)'
new_put_text = 'cv2.putText(annotated_frame, f"{vehicle_type.upper()} - {text}", (px1 + 5, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 0), thickness)'
content = content.replace(old_put_text, new_put_text)

old_text_size = '(tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)'
new_text_size = '(tw, th), _ = cv2.getTextSize(f"{vehicle_type.upper()} - {text}", cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)'
content = content.replace(old_text_size, new_text_size)


with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")
