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
                COUNT(*) AS sales_count,
                CASE
                    WHEN COUNT(*) > 0
                    THEN ROUND(COALESCE(SUM(total_amount), 0) / COUNT(*), 2)
                    ELSE 0
                END AS average_ticket
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

    top_products = db.execute(
        text(
            """
            SELECT
                p.name AS name,
                SUM(s.quantity) AS total_quantity,
                SUM(s.total_amount) AS total_sales
            FROM sales s
            JOIN products p ON p.id = s.product_id
            GROUP BY p.name
            ORDER BY total_sales DESC
            LIMIT 5
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
    top_product = top_products[0]["name"] if top_products else None

    return to_jsonable(
        {
            "currency": "DH",
            "domain": "sales",
            "totals": dict(totals) if totals else {},
            "best_region": best_region,
            "top_product": top_product,
            "sales_by_region": [dict(row) for row in by_region],
            "sales_by_category": [dict(row) for row in by_category],
            "top_products": [dict(row) for row in top_products],
            "monthly_sales": [dict(row) for row in monthly],
        }
    )
