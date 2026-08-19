import os
import shutil

source = "new_dataset"
target = "test_dataset"

for root, dirs, files in os.walk(source):
    for file in files:
        if file.endswith((".jpg", ".png")):

            src = os.path.join(root, file)

            # Correct classification logic
            if "non" in root.lower():
                dst_folder = "no_crack"
            elif "crack" in root.lower():
                dst_folder = "crack"
            else:
                continue

            dst = os.path.join(target, dst_folder)
            os.makedirs(dst, exist_ok=True)

            shutil.copy(src, dst)

print("✅ Dataset flattened successfully!")