import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.interpreter import to_jsonable


def detect_chart_type(data: list[dict]) -> str:
    if not data:
        return "none"

    sample = data[0]
    time_keys = ("date", "month", "mois", "year", "annee")

    for key in sample:
        if any(word in key.lower() for word in time_keys):
            return "line"

    return "bar"


def save_analysis(
    db: Session,
    user_id: int,
    question: str,
    sql: str,
    chart_type: str,
    interpretation: str,
    result_payload: dict,
) -> int:
    safe_payload = to_jsonable(result_payload)
    row = db.execute(
        text(
            """
            INSERT INTO analysis_history
                (user_id, question, generated_sql, chart_type, interpretation, result_json)
            VALUES
                (:user_id, :question, :generated_sql, :chart_type, :interpretation, CAST(:result_json AS jsonb))
            RETURNING id
            """
        ),
        {
            "user_id": user_id,
            "question": question,
            "generated_sql": sql,
            "chart_type": chart_type,
            "interpretation": interpretation,
            "result_json": json.dumps(safe_payload, ensure_ascii=False),
        },
    ).mappings().first()
    db.commit()
    return row["id"] if row else None


def list_history(db: Session, user_id: int, limit: int = 30) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, question, chart_type, interpretation, created_at
            FROM analysis_history
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        {"user_id": user_id, "limit": limit},
    ).mappings().all()

    return to_jsonable([dict(row) for row in rows])


def get_analysis(db: Session, user_id: int, analysis_id: int) -> dict | None:
    row = db.execute(
        text(
            """
            SELECT id, question, generated_sql, chart_type, interpretation, result_json, created_at
            FROM analysis_history
            WHERE id = :analysis_id AND user_id = :user_id
            """
        ),
        {"analysis_id": analysis_id, "user_id": user_id},
    ).mappings().first()

    if not row:
        return None

    data = dict(row)
    return to_jsonable(data)
