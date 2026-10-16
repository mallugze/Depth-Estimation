from sqlalchemy import Column, Integer, String, Float, DateTime
import datetime
from src.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    prediction = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    severity_score = Column(Float, default=0.0)
    crack_area_pct = Column(Float, default=0.0)
    crack_length_px = Column(Float, default=0.0)
    max_depth_drop = Column(Float, default=0.0)
    depth_std = Column(Float)
    image_path = Column(String)
    depth_map_path = Column(String)
    contour_path = Column(String, nullable=True)
    structure_type = Column(String, default="General Concrete")
    repair_deadline = Column(String, default="Routine Annual Inspection (365 Days)")
    repair_priority = Column(String, default="SAFE / ROUTINE")
    repair_action = Column(String, nullable=True)
    repair_days = Column(Integer, default=365)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
