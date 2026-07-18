from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.messages import bilingual


def is_safe_select(sql: str) -> bool:
    cleaned = " ".join(sql.strip().lower().split())
    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "create", ";--"]

    if not cleaned.startswith("select"):
        return False

    for word in forbidden:
        if word in cleaned:
            return False

    return True


def execute_select(db: Session, sql: str):
    if not is_safe_select(sql):
        raise HTTPException(
            status_code=400,
            detail=bilingual("select_only"),
        )

    try:
        rows = db.execute(text(sql)).mappings().all()
        return [dict(row) for row in rows]
    except Exception as error:
        detail = bilingual("sql_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=400, detail=detail) from error