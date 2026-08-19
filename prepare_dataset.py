import os
import shutil
import random

# Paths
source_path = "dataset"
output_path = "final_dataset"

classes = {
    "positive": "crack",
    "negative": "no_crack"
}

split_ratio = 0.8

for folder, new_name in classes.items():
    images = os.listdir(os.path.join(source_path, folder))
    random.shuffle(images)

    split = int(len(images) * split_ratio)

    train_imgs = images[:split]
    val_imgs = images[split:]

    for img in train_imgs:
        src = os.path.join(source_path, folder, img)
        dst = os.path.join(output_path, "train", new_name)
        os.makedirs(dst, exist_ok=True)
        shutil.copy(src, dst)

    for img in val_imgs:
        src = os.path.join(source_path, folder, img)
        dst = os.path.join(output_path, "val", new_name)
        os.makedirs(dst, exist_ok=True)
        shutil.copy(src, dst)

print("✅ Dataset ready!")