from ultralytics import YOLO

model = YOLO("yolov8n-cls.pt")

model.train(
    data="final_dataset",
    epochs=15,
    imgsz=224,
    batch=16
)