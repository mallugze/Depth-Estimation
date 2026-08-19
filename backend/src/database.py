from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./reports.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def auto_migrate_sqlite():
    """Automatically adds new columns to SQLite table if they do not exist."""
    with engine.connect() as conn:
        try:
            # Check existing columns
            res = conn.execute(text("PRAGMA table_info(reports)"))
            columns = [row[1] for row in res.fetchall()]
            
            if columns: # Table exists
                new_columns = {
                    "severity_score": "FLOAT DEFAULT 0.0",
                    "crack_area_pct": "FLOAT DEFAULT 0.0",
                    "crack_length_px": "FLOAT DEFAULT 0.0",
                    "max_depth_drop": "FLOAT DEFAULT 0.0",
                    "contour_path": "VARCHAR",
                    "structure_type": "VARCHAR DEFAULT 'General Concrete'"
                }
                
                for col_name, col_type in new_columns.items():
                    if col_name not in columns:
                        conn.execute(text(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type}"))
                        print(f"Migrated column: {col_name}")
                conn.commit()
        except Exception as e:
            print(f"Auto-migration note: {e}")
