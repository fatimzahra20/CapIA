from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.interpreter import to_jsonable

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    totals = db.execute(
        text(
            """
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_amount,
                COALESCE(SUM(quantity), 0) AS total_quantity,
                COUNT(*) AS sales_count
            FROM sales
            """
        )
    ).mappings().first()

    by_region = db.execute(
        text(
            """
            SELECT r.name AS name, SUM(s.total_amount) AS total_sales
            FROM sales s
            JOIN regions r ON r.id = s.region_id
            GROUP BY r.name
            ORDER BY total_sales DESC
            """
        )
    ).mappings().all()

    by_category = db.execute(
        text(
            """
            SELECT p.category AS name, SUM(s.total_amount) AS total_sales
            FROM sales s
            JOIN products p ON p.id = s.product_id
            GROUP BY p.category
            ORDER BY total_sales DESC
            """
        )
    ).mappings().all()

    monthly = db.execute(
        text(
            """
            SELECT
                TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month,
                SUM(total_amount) AS total_sales
            FROM sales
            GROUP BY 1
            ORDER BY 1
            """
        )
    ).mappings().all()

    best_region = by_region[0]["name"] if by_region else None

    return to_jsonable(
        {
            "totals": dict(totals) if totals else {},
            "best_region": best_region,
            "sales_by_region": [dict(row) for row in by_region],
            "sales_by_category": [dict(row) for row in by_category],
            "monthly_sales": [dict(row) for row in monthly],
        }
    )
