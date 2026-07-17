from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import get_db

app = FastAPI(title="CAP AI")


@app.get("/")
def root():
    return {"message": "CAP AI backend is running"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"database": "ok", "result": result}


@app.get("/regions")
def list_regions(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, name FROM regions ORDER BY name")).mappings().all()
    return {"regions": [dict(row) for row in rows]}


@app.get("/sales/by-region")
def sales_by_region(db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT r.name AS region, SUM(s.total_amount) AS total_ventes
            FROM sales s
            JOIN regions r ON r.id = s.region_id
            GROUP BY r.name
            ORDER BY total_ventes DESC
            """
        )
    ).mappings().all()
    return {"sales_by_region": [dict(row) for row in rows]}