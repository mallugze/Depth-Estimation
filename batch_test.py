import os
import cv2
import torch
from ultralytics import YOLO

# Load models
yolo_model = YOLO("yolov8n.pt")
midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
midas.eval()

transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = transforms.small_transform

# Paths
dataset_path = "dataset"
output_path = "outputs"

os.makedirs(output_path, exist_ok=True)

def process_folder(folder_name):
    folder_path = os.path.join(dataset_path, folder_name)

    for img_name in os.listdir(folder_path):
        img_path = os.path.join(folder_path, img_name)

        img = cv2.imread(img_path)
        if img is None:
            print(f"Skipping {img_name}")
            continue

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # YOLO
        results = yolo_model(img)

        # Depth
        input_batch = transform(img_rgb)

        with torch.no_grad():
            prediction = midas(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=img_rgb.shape[:2],
                mode="bicubic",
                align_corners=False,
            ).squeeze()

        depth_map = prediction.cpu().numpy()

        # Draw detections
        for r in results:
            boxes = r.boxes.xyxy.cpu().numpy()
            for box in boxes:
                x1, y1, x2, y2 = map(int, box)

                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)

                depth = depth_map[cy, cx]

                cv2.rectangle(img, (x1,y1),(x2,y2),(0,255,0),2)
                cv2.putText(img, f"{depth:.2f}",
                            (x1,y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0,255,0),
                            2)

        # Save output
        save_path = os.path.join(output_path, f"{folder_name}_{img_name}")
        cv2.imwrite(save_path, img)

        print(f"Processed: {img_name}")

# Run both folders
process_folder("positive")
process_folder("negative")

print("✅ All images processed!")