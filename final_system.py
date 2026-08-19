import torch
import cv2
import numpy as np
from ultralytics import YOLO

# ---------------- LOAD MODELS ---------------- #

# Crack classification model
crack_model = YOLO("runs/classify/train/weights/best.pt")

# MiDaS depth model
midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
midas.eval()

transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = transforms.small_transform

# ---------------- LOAD IMAGE ---------------- #

img = cv2.imread("test_image.jpg")

if img is None:
    print("❌ Image not found")
    exit()

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# ---------------- CRACK DETECTION ---------------- #

result = crack_model(img)[0]
probs = result.probs.data.tolist()

classes = ["crack", "no_crack"]
pred = classes[probs.index(max(probs))]
confidence = max(probs)

# ---------------- DEPTH ESTIMATION ---------------- #

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

# Normalize depth for display
depth_normalized = cv2.normalize(depth_map, None, 0, 255, cv2.NORM_MINMAX)
depth_normalized = np.uint8(depth_normalized)

# Apply color map
depth_colored = cv2.applyColorMap(depth_normalized, cv2.COLORMAP_PLASMA)

# ---------------- SEVERITY ANALYSIS ---------------- #

depth_variation = np.std(depth_map)
print("Depth variation:", depth_variation)

if depth_variation > 80:
    severity = "HIGH"
elif depth_variation > 40:
    severity = "MEDIUM"
else:
    severity = "LOW"

# ---------------- DISPLAY RESULTS (FIXED) ---------------- #

# Add text BEFORE resizing
cv2.putText(img, f"{pred} ({confidence:.2f})",
            (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,255,0), 3)

cv2.putText(img, f"Severity: {severity}",
            (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,255), 3)

# Resize both images properly
h, w = 400, 600
img_resized = cv2.resize(img, (w, h))
depth_resized = cv2.resize(depth_colored, (w, h))

# Combine side by side
combined = np.hstack((img_resized, depth_resized))

# Draw background rectangle
cv2.rectangle(img, (10,10), (350,140), (0,0,0), -1)



# Clean & professional text

cv2.putText(img, f"Prediction: {pred}",
            (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

cv2.putText(img, f"Confidence: {confidence:.2f}",
            (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)

cv2.putText(img, f"Severity: {severity}",
            (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)

# Show ONE clean window
cv2.namedWindow("Final Output", cv2.WINDOW_NORMAL)
cv2.imshow("Final Output", combined)
cv2.resizeWindow("Final Output", 1200, 500)

cv2.waitKey(0)
cv2.destroyAllWindows()



# Show windows
cv2.imshow("Crack Detection + Severity", img)
cv2.imshow("Depth Map", depth_colored)

cv2.waitKey(0)
cv2.destroyAllWindows()