from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("/by-region")
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