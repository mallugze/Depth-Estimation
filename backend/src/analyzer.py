import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO

class Analyzer:
    def __init__(self):
        print("Initializing Multi-Signal Structural Crack & Depth Analyzer...")
        
        # Priority order for model weights:
        # 1. New cross-domain model
        # 2. Previous trained model
        # 3. Base pretrained YOLOv8-cls
        cross_domain_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../runs/classify/cross_domain_model/weights/best.pt'))
        prev_model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../runs/classify/train/weights/best.pt'))
        base_model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../yolov8n-cls.pt'))
        
        if os.path.exists(cross_domain_path):
            self.model_path = cross_domain_path
            print(f"Loading Cross-Domain Model: {cross_domain_path}")
        elif os.path.exists(prev_model_path):
            self.model_path = prev_model_path
            print(f"Loading Model: {prev_model_path}")
        else:
            self.model_path = base_model_path
            print(f"Loading Base Model: {base_model_path}")
            
        self.yolo_model = YOLO(self.model_path)
        
        # Load MiDaS for monocular depth estimation
        self.device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        print(f"Inference device: {self.device}")
        
        model_type = "MiDaS_small"
        self.midas = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
        self.midas.to(self.device)
        self.midas.eval()
        
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        self.transform = midas_transforms.small_transform
        
        print("Analyzer initialized successfully.")

    def reload_model_if_available(self):
        """Reloads cross-domain model if newly trained weights become available."""
        cross_domain_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../runs/classify/cross_domain_model/weights/best.pt'))
        if os.path.exists(cross_domain_path) and self.model_path != cross_domain_path:
            print(f"Reloading updated weights: {cross_domain_path}")
            self.model_path = cross_domain_path
            self.yolo_model = YOLO(cross_domain_path)

    def extract_crack_morphometry(self, img_bgr):
        """Extracts crack contours, area percentage, length, and creates a visual overlay."""
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # Multi-scale morphological filtering to highlight fissure structures
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        
        # Adaptive thresholding for crack detection
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 15, 4
        )
        
        # Morphological clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter small noise contours
        min_contour_area = 20
        crack_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]
        
        total_pixels = img_bgr.shape[0] * img_bgr.shape[1]
        crack_pixels = sum(cv2.contourArea(cnt) for cnt in crack_contours)
        crack_area_pct = float(round((crack_pixels / total_pixels) * 100, 2))
        
        total_length = sum(cv2.arcLength(cnt, False) for cnt in crack_contours) / 2.0
        crack_length_px = float(round(total_length, 1))
        
        # Create visual overlay
        overlay = img_bgr.copy()
        cv2.drawContours(overlay, crack_contours, -1, (0, 255, 255), 2) # Neon cyan/yellow
        
        # Blend overlay with original
        contour_img = cv2.addWeighted(img_bgr, 0.65, overlay, 0.35, 0)
        
        return {
            "crack_area_pct": crack_area_pct,
            "crack_length_px": crack_length_px,
            "contour_img": contour_img,
            "mask": cleaned
        }

    def compute_cross_section_profile(self, depth_map, x1=None, y1=None, x2=None, y2=None, num_samples=100):
        """Computes 1D depth profile cross-section along a line across the surface."""
        h, w = depth_map.shape[:2]
        
        if x1 is None or y1 is None or x2 is None or y2 is None:
            # Default to horizontal cross-section through center
            y1 = y2 = h // 2
            x1 = 0
            x2 = w - 1
            
        # Ensure within bounds
        x1 = max(0, min(w - 1, int(x1)))
        x2 = max(0, min(w - 1, int(x2)))
        y1 = max(0, min(h - 1, int(y1)))
        y2 = max(0, min(h - 1, int(y2)))
        
        # Sample points along the line
        xs = np.linspace(x1, x2, num_samples)
        ys = np.linspace(y1, y2, num_samples)
        
        profile = []
        for i in range(num_samples):
            px = int(round(xs[i]))
            py = int(round(ys[i]))
            val = float(depth_map[py, px])
            profile.append({
                "index": i,
                "x": px,
                "y": py,
                "depth": round(val, 2)
            })
            
        return profile

    def generate_3d_point_cloud(self, img_rgb, depth_map, grid_size=64):
        """Generates downsampled 3D point cloud data (X, Y, Z, R, G, B) for WebGL rendering."""
        h, w = depth_map.shape[:2]
        
        # Normalize depth map to 0-1
        d_min, d_max = depth_map.min(), depth_map.max()
        depth_norm = (depth_map - d_min) / (d_max - d_min + 1e-8)
        
        # Downsample for WebGL performance
        step_x = max(1, w // grid_size)
        step_y = max(1, h // grid_size)
        
        points = []
        for y in range(0, h, step_y):
            for x in range(0, w, step_x):
                # Normalized coordinates centered at (0,0)
                norm_x = round((x / w - 0.5) * 10.0, 2)
                norm_y = round(-(y / h - 0.5) * 10.0, 2) # Invert Y for 3D space
                norm_z = round(float(depth_norm[y, x]) * 4.0, 2)
                
                r, g, b = img_rgb[y, x]
                points.append([norm_x, norm_y, norm_z, int(r), int(g), int(b)])
                
        return points

    def analyze_image(self, img_bytes: bytes, colormap_name: str = "INFERNO"):
        """Performs full multi-signal crack detection, depth estimation, and severity profiling."""
        self.reload_model_if_available()
        
        # 1. Decode image
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image")
        
        h, w = img.shape[:2]
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 2. YOLO Crack Classification
        yolo_results = self.yolo_model.predict(img_rgb, verbose=False)
        probs = yolo_results[0].probs
        top1_idx = probs.top1
        top1_conf = float(probs.top1conf)
        class_name = self.yolo_model.names[top1_idx]
        is_crack = "crack" in class_name.lower() and "no" not in class_name.lower()

        # 3. MiDaS Monocular Depth Estimation
        input_batch = self.transform(img_rgb).to(self.device)
        with torch.no_grad():
            prediction = self.midas(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=(h, w),
                mode="bicubic",
                align_corners=False,
            ).squeeze()
        
        depth_map = prediction.cpu().numpy()
        
        # 4. Crack Morphometry & Contours
        morph_data = self.extract_crack_morphometry(img)
        crack_area_pct = morph_data["crack_area_pct"] if is_crack else 0.0
        crack_length_px = morph_data["crack_length_px"] if is_crack else 0.0
        contour_img = morph_data["contour_img"]

        # 5. Scientific Severity Index Calculation (SSI)
        # Compute depth gradient across surface
        grad_x = cv2.Sobel(depth_map, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(depth_map, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(grad_x**2 + grad_y**2)
        
        depth_std = float(round(np.std(depth_map), 2))
        max_depth_drop = float(round(np.percentile(grad_mag, 99) - np.percentile(grad_mag, 5), 2))
        
        if not is_crack:
            # Structurally Sound / Clear
            severity_score = round(max(0.0, min(20.0, depth_std * 0.15)), 1)
            severity = "CLEAR"
        else:
            # Composite structural severity formula
            # Factors: Model confidence (0-25), Crack Area % (0-25), Depth Gradient (0-25), Depth Drop (0-25)
            conf_term = top1_conf * 25.0
            area_term = min(25.0, crack_area_pct * 5.0)
            grad_term = min(25.0, (depth_std / 50.0) * 25.0)
            drop_term = min(25.0, (max_depth_drop / 40.0) * 25.0)
            
            raw_score = conf_term + area_term + grad_term + drop_term
            severity_score = float(round(min(100.0, max(25.0, raw_score)), 1))
            
            if severity_score >= 80:
                severity = "CRITICAL"
            elif severity_score >= 60:
                severity = "HIGH"
            elif severity_score >= 40:
                severity = "MEDIUM"
            else:
                severity = "LOW"

        # 6. Generate Heatmap with selected colormap
        depth_min, depth_max = depth_map.min(), depth_map.max()
        depth_norm = (depth_map - depth_min) / (depth_max - depth_min + 1e-8)
        depth_uint8 = (depth_norm * 255).astype(np.uint8)
        
        colormap_dict = {
            "INFERNO": cv2.COLORMAP_INFERNO,
            "PLASMA": cv2.COLORMAP_PLASMA,
            "VIRIDIS": cv2.COLORMAP_VIRIDIS,
            "TURBO": cv2.COLORMAP_TURBO,
            "JET": cv2.COLORMAP_JET
        }
        selected_cmap = colormap_dict.get(colormap_name.upper(), cv2.COLORMAP_INFERNO)
        heatmap = cv2.applyColorMap(depth_uint8, selected_cmap)

        # 7. Cross-Section Profile
        profile_data = self.compute_cross_section_profile(depth_map)

        # 8. 3D Point Cloud Data
        point_cloud_3d = self.generate_3d_point_cloud(img_rgb, depth_map, grid_size=64)

        return {
            "prediction": class_name,
            "confidence": round(top1_conf, 4),
            "severity": severity,
            "severity_score": severity_score,
            "depth_std": depth_std,
            "crack_area_pct": crack_area_pct,
            "crack_length_px": crack_length_px,
            "max_depth_drop": max_depth_drop,
            "heatmap": heatmap,
            "contour_img": contour_img,
            "profile_data": profile_data,
            "point_cloud_3d": point_cloud_3d,
            "image_dims": {"width": w, "height": h}
        }

# Singleton analyzer instance
analyzer_instance = None

def get_analyzer():
    global analyzer_instance
    if analyzer_instance is None:
        analyzer_instance = Analyzer()
    return analyzer_instance
