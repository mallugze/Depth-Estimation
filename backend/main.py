from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
import uvicorn
import os
import uuid
import cv2
import io
import csv
from typing import List, Optional

from src.analyzer import get_analyzer
from src.database import get_db, engine, auto_migrate_sqlite
from src import models

# Create database tables & migrate schema
models.Base.metadata.create_all(bind=engine)
auto_migrate_sqlite()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data storage directories exist
    os.makedirs("data/uploads", exist_ok=True)
    os.makedirs("data/depth_maps", exist_ok=True)
    os.makedirs("data/contours", exist_ok=True)
    # Ensure columns exist
    auto_migrate_sqlite()
    # Pre-load analyzer on startup
    get_analyzer()
    yield

app = FastAPI(title="StructurAI - Structural Crack & Depth Analysis API", lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file routes
app.mount("/data", StaticFiles(directory="data"), name="data")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "StructurAI Multi-Signal Crack & Depth Platform",
        "version": "2.0.0"
    }

@app.get("/models/info")
def get_model_info():
    analyzer = get_analyzer()
    return {
        "model_path": analyzer.model_path,
        "device": str(analyzer.device),
        "backbone": "YOLOv8 Nano (Cross-Domain Multi-Dataset Augmented)",
        "depth_engine": "MiDaS Monocular Disparity v2.1",
        "metrics_supported": [
            "Classification Confidence",
            "Structural Severity Index (0-100)",
            "Crack Morphometry (Area %, Length px)",
            "Crack-Specific Depth Discontinuity (CSDD)",
            "1D Cross-Section Depth Profiling",
            "3D WebGL Point Cloud Mapping"
        ]
    }

@app.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    reports = db.query(models.Report).all()
    total_scans = len(reports)
    
    if total_scans == 0:
        return {
            "total_scans": 0,
            "crack_count": 0,
            "clear_count": 0,
            "anomaly_rate": 0.0,
            "severity_counts": {"CLEAR": 0, "LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            "avg_severity_score": 0.0,
            "avg_depth_std": 0.0
        }
        
    crack_count = sum(1 for r in reports if "crack" in r.prediction.lower() and "no" not in r.prediction.lower())
    clear_count = total_scans - crack_count
    
    severity_counts = {"CLEAR": 0, "LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    total_score = 0.0
    total_std = 0.0
    
    for r in reports:
        sev = r.severity.upper() if r.severity else "CLEAR"
        if sev in severity_counts:
            severity_counts[sev] += 1
        else:
            severity_counts["MEDIUM"] += 1
        total_score += (r.severity_score or 0.0)
        total_std += (r.depth_std or 0.0)
        
    return {
        "total_scans": total_scans,
        "crack_count": crack_count,
        "clear_count": clear_count,
        "anomaly_rate": round((crack_count / total_scans) * 100, 1),
        "severity_counts": severity_counts,
        "avg_severity_score": round(total_score / total_scans, 1),
        "avg_depth_std": round(total_std / total_scans, 2)
    }

@app.get("/reports/export/csv")
def export_reports_csv(db: Session = Depends(get_db)):
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Filename', 'Structure Type', 'Prediction', 'Confidence', 
        'Severity', 'Severity Score (0-100)', 'Crack Area %', 
        'Crack Length (px)', 'Max Depth Drop', 'Depth Std', 'Created At'
    ])
    
    for r in reports:
        writer.writerow([
            r.id, r.filename, getattr(r, 'structure_type', 'General'),
            r.prediction, round(r.confidence, 4), r.severity,
            getattr(r, 'severity_score', 0.0),
            getattr(r, 'crack_area_pct', 0.0),
            getattr(r, 'crack_length_px', 0.0),
            getattr(r, 'max_depth_drop', 0.0),
            round(r.depth_std, 2),
            r.created_at
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=structurai_inspection_reports.csv"}
    )

@app.get("/reports")
def get_reports(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Report)
    
    if severity and severity.upper() != "ALL":
        query = query.filter(models.Report.severity == severity.upper())
        
    if search:
        query = query.filter(models.Report.filename.ilike(f"%{search}%"))
        
    reports = query.order_by(models.Report.created_at.desc()).all()
    
    if status and status.upper() != "ALL":
        if status.upper() == "CRACK":
            reports = [r for r in reports if "crack" in r.prediction.lower() and "no" not in r.prediction.lower()]
        elif status.upper() == "CLEAR":
            reports = [r for r in reports if "no" in r.prediction.lower() or "clear" in r.prediction.lower()]
            
    return reports

@app.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Remove files if they exist
    for path_attr in [report.image_path, report.depth_map_path, getattr(report, 'contour_path', None)]:
        if path_attr:
            clean_path = path_attr.lstrip('/')
            if os.path.exists(clean_path):
                try:
                    os.remove(clean_path)
                except Exception:
                    pass
                    
    db.delete(report)
    db.commit()
    return {"status": "success", "message": f"Report {report_id} deleted"}

@app.delete("/reports")
def clear_all_reports(db: Session = Depends(get_db)):
    db.query(models.Report).delete()
    db.commit()
    return {"status": "success", "message": "All reports cleared"}

@app.post("/analyze-image")
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    colormap: str = Form("INFERNO"),
    structure_type: str = Form("General Concrete"),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
    
    try:
        contents = await file.read()
        analyzer = get_analyzer()
        result = analyzer.analyze_image(contents, colormap_name=colormap)
        
        # Save files
        unique_id = str(uuid.uuid4())[:8]
        safe_name = os.path.splitext(file.filename)[0].replace(" ", "_")
        
        orig_filename = f"{unique_id}_{safe_name}.jpg"
        orig_path = os.path.join("data", "uploads", orig_filename)
        with open(orig_path, "wb") as f:
            f.write(contents)
            
        depth_filename = f"{unique_id}_{safe_name}_depth.jpg"
        depth_path = os.path.join("data", "depth_maps", depth_filename)
        cv2.imwrite(depth_path, result["heatmap"])
        
        contour_filename = f"{unique_id}_{safe_name}_contour.jpg"
        contour_path = os.path.join("data", "contours", contour_filename)
        cv2.imwrite(contour_path, result["contour_img"])
        
        orig_url = f"/data/uploads/{orig_filename}"
        depth_url = f"/data/depth_maps/{depth_filename}"
        contour_url = f"/data/contours/{contour_filename}"

        # Save to DB
        db_report = models.Report(
            filename=file.filename,
            prediction=result["prediction"],
            confidence=result["confidence"],
            severity=result["severity"],
            severity_score=result["severity_score"],
            crack_area_pct=result["crack_area_pct"],
            crack_length_px=result["crack_length_px"],
            max_depth_drop=result["max_depth_drop"],
            depth_std=result["depth_std"],
            image_path=orig_url,
            depth_map_path=depth_url,
            contour_path=contour_url,
            structure_type=structure_type
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        # Return full analysis payload for interactive UI
        return {
            "id": db_report.id,
            "filename": db_report.filename,
            "prediction": db_report.prediction,
            "confidence": db_report.confidence,
            "severity": db_report.severity,
            "severity_score": db_report.severity_score,
            "crack_area_pct": db_report.crack_area_pct,
            "crack_length_px": db_report.crack_length_px,
            "max_depth_drop": db_report.max_depth_drop,
            "depth_std": db_report.depth_std,
            "image_path": orig_url,
            "depth_map_path": depth_url,
            "contour_path": contour_url,
            "structure_type": structure_type,
            "created_at": db_report.created_at,
            "profile_data": result["profile_data"],
            "point_cloud_3d": result["point_cloud_3d"],
            "image_dims": result["image_dims"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-batch")
async def analyze_batch_endpoint(
    files: List[UploadFile] = File(...),
    structure_type: str = Form("General Concrete"),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    analyzer = get_analyzer()
    results = []
    
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
            
        try:
            contents = await file.read()
            res = analyzer.analyze_image(contents)
            
            unique_id = str(uuid.uuid4())[:8]
            safe_name = os.path.splitext(file.filename)[0].replace(" ", "_")
            
            orig_filename = f"{unique_id}_{safe_name}.jpg"
            orig_path = os.path.join("data", "uploads", orig_filename)
            with open(orig_path, "wb") as f:
                f.write(contents)
                
            depth_filename = f"{unique_id}_{safe_name}_depth.jpg"
            depth_path = os.path.join("data", "depth_maps", depth_filename)
            cv2.imwrite(depth_path, res["heatmap"])
            
            contour_filename = f"{unique_id}_{safe_name}_contour.jpg"
            contour_path = os.path.join("data", "contours", contour_filename)
            cv2.imwrite(contour_path, res["contour_img"])
            
            orig_url = f"/data/uploads/{orig_filename}"
            depth_url = f"/data/depth_maps/{depth_filename}"
            contour_url = f"/data/contours/{contour_filename}"
            
            db_report = models.Report(
                filename=file.filename,
                prediction=res["prediction"],
                confidence=res["confidence"],
                severity=res["severity"],
                severity_score=res["severity_score"],
                crack_area_pct=res["crack_area_pct"],
                crack_length_px=res["crack_length_px"],
                max_depth_drop=res["max_depth_drop"],
                depth_std=res["depth_std"],
                image_path=orig_url,
                depth_map_path=depth_url,
                contour_path=contour_url,
                structure_type=structure_type
            )
            db.add(db_report)
            db.commit()
            db.refresh(db_report)
            
            results.append({
                "id": db_report.id,
                "filename": db_report.filename,
                "prediction": db_report.prediction,
                "confidence": db_report.confidence,
                "severity": db_report.severity,
                "severity_score": db_report.severity_score,
                "depth_std": db_report.depth_std,
                "image_path": orig_url,
                "depth_map_path": depth_url
            })
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            
    return {
        "processed_count": len(results),
        "reports": results
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
