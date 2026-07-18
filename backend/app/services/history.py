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
    question: str,
    sql: str,
    chart_type: str,
    interpretation: str,
) -> None:
    db.execute(
        text(
            """
            INSERT INTO analysis_history
                (question, generated_sql, chart_type, interpretation)
            VALUES
                (:question, :generated_sql, :chart_type, :interpretation)
            """
        ),
        {
            "question": question,
            "generated_sql": sql,
            "chart_type": chart_type,
            "interpretation": interpretation,
        },
    )
    db.commit()


def list_history(db: Session, limit: int = 20) -> list[dict]:
    rows = db.execute(
        text(
            """
            SELECT id, question, chart_type, interpretation, created_at
            FROM analysis_history
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        {"limit": limit},
    ).mappings().all()

    return to_jsonable([dict(row) for row in rows])
