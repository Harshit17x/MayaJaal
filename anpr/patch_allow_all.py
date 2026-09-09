import re

with open(r'..\..\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update vehicle detection confidence from 0.50 to 0.10 to allow all detections
content = content.replace(
    "results_vehicles = model(image_bgr, imgsz=640, conf=0.50, classes=[2, 3, 5, 7], verbose=False)",
    "results_vehicles = model(image_bgr, imgsz=640, conf=0.10, classes=[2, 3, 5, 7], verbose=False)"
)

with open(r'..\..\app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully: lowered confidence to 0.10")
