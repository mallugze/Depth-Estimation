import os
from ultralytics import YOLO

def train_model():
    print("🚀 Initializing Cross-Domain Crack Classification Training...")
    
    # Load pretrained YOLOv8 nano classification model
    model = YOLO("yolov8n-cls.pt")
    
    # Train on balanced multi-domain dataset (CCIC + SDNET2018 Decks, Pavements, Walls)
    results = model.train(
        data="balanced_dataset",
        epochs=8,
        imgsz=224,
        batch=32,
        workers=4,
        name="cross_domain_model",
        project="runs/classify",
        exist_ok=True,
        augment=True,
        fliplr=0.5,
        flipud=0.5,
        degrees=15.0,
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.4,
        scale=0.2,
        patience=10,
        verbose=True
    )
    
    print("✅ Training complete! Best weights saved to runs/classify/cross_domain_model/weights/best.pt")
    return results

if __name__ == "__main__":
    train_model()
