import os
from ultralytics import YOLO

model = YOLO("runs/classify/train/weights/best.pt")

path = "test_dataset"

correct = 0
total = 0

for label in ["crack", "no_crack"]:
    folder = os.path.join(path, label)

    for img in os.listdir(folder):
        img_path = os.path.join(folder, img)

        result = model(img_path)
        probs = result[0].probs.data.tolist()

        classes = ["crack", "no_crack"]
        pred = classes[probs.index(max(probs))]

        if pred == label:
            correct += 1

        total += 1

accuracy = correct / total
print(f"\n🔥 Accuracy on SDNET2018: {accuracy:.2f}")