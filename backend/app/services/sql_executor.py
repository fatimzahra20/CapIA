import re

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.messages import bilingual

FORBIDDEN_KEYWORDS = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "truncate",
    "create",
    "grant",
    "revoke",
    "replace",
    "merge",
    "call",
    "execute",
    "copy",
    "vacuum",
    "comment",
]


def is_safe_select(sql: str) -> bool:
    cleaned = " ".join(sql.strip().lower().split())

    if not cleaned.startswith("select"):
        return False

    # Block multiple statements
    if ";" in cleaned.rstrip(";"):
        return False

    for word in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{word}\b", cleaned):
            return False

    return True


def execute_select(db: Session, sql: str, limit: int = 200):
    if not is_safe_select(sql):
        raise HTTPException(
            status_code=400,
            detail=bilingual("select_only"),
        )

    try:
        result = db.execute(text(sql))
        rows = result.mappings().all()
        limited = [dict(row) for row in rows[:limit]]
        return limited
    except Exception as error:
        detail = bilingual("sql_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=400, detail=detail) from error
