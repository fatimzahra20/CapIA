from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


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
            detail="Seules les requêtes SELECT sont autorisées",
        )

    try:
        rows = db.execute(text(sql)).mappings().all()
        return [dict(row) for row in rows]
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur SQL: {error}",
        ) from error