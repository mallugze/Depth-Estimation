import torch
import cv2
import numpy as np
from ultralytics import YOLO

# Load YOLO model
yolo_model = YOLO("yolov8n.pt")

# Load MiDaS model
midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
midas.eval()

# Load transforms
transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = transforms.small_transform

# Read image
img = cv2.imread("test_image.jpg")
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# YOLO detection
results = yolo_model(img)

# Depth estimation
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

# Draw detections with depth
for r in results:
    boxes = r.boxes.xyxy.cpu().numpy()
    for box in boxes:
        x1, y1, x2, y2 = map(int, box)

        # center point
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)

        depth = depth_map[cy, cx]

        cv2.rectangle(img, (x1,y1),(x2,y2),(0,255,0),2)
        cv2.putText(img, f"Depth:{depth:.2f}",
                    (x1,y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0,255,0),
                    2)

cv2.imshow("Object Detection + Depth", img)
cv2.waitKey(0)
cv2.destroyAllWindows()