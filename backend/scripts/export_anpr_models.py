import os
import shutil
from pathlib import Path
from ultralytics import YOLO

def export_models():
    base_dir = Path(__file__).resolve().parents[2]
    anpr_dir = base_dir / "anpr"
    models_dir = base_dir / "backend" / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    print("=== Step 1: Exporting vehicle detector (yolov8s.pt) to ONNX ===")
    vehicle_pt = anpr_dir / "yolov8s.pt"
    if not vehicle_pt.exists():
        raise FileNotFoundError(f"Vehicle model not found at {vehicle_pt}")
    
    vehicle_model = YOLO(str(vehicle_pt))
    vehicle_onnx_path = vehicle_model.export(format="onnx", imgsz=640, dynamic=True, simplify=True)
    target_vehicle_onnx = models_dir / "vehicle_detector.onnx"
    shutil.move(vehicle_onnx_path, str(target_vehicle_onnx))
    print(f"Vehicle detector exported to: {target_vehicle_onnx}")

    print("\n=== Step 2: Exporting plate detector (train-4/weights/best.pt) to ONNX ===")
    plate_pt = anpr_dir / "train-4" / "weights" / "best.pt"
    if not plate_pt.exists():
        raise FileNotFoundError(f"Plate model not found at {plate_pt}")
        
    plate_model = YOLO(str(plate_pt))
    plate_onnx_path = plate_model.export(format="onnx", imgsz=640, dynamic=True, simplify=True)
    target_plate_onnx = models_dir / "anpr_plate.onnx"
    shutil.move(plate_onnx_path, str(target_plate_onnx))
    print(f"Plate detector exported to: {target_plate_onnx}")

    print("\nBoth models successfully exported and moved to backend/models/!")

if __name__ == "__main__":
    export_models()
