from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth import get_current_user
from app.services.history import (
    detect_chart_type,
    get_analysis,
    list_history,
    save_analysis,
)
from app.services.interpreter import compute_kpis, interpret_results, to_jsonable
from app.services.messages import bilingual, detect_language
from app.services.ollama import ask_mistral
from app.services.sql_executor import execute_select
from app.services.sql_generator import generate_sql

router = APIRouter(prefix="/ai", tags=["ai"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_ai(
    payload: QuestionRequest,
    current_user: dict = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail=bilingual("empty_question"))

    lang = detect_language(payload.question)

    try:
        answer = ask_mistral(payload.question)
    except Exception as error:
        detail = bilingual("ollama_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=500, detail=detail) from error

    return {
        "question": payload.question,
        "language": lang,
        "answer": answer,
        "user_id": current_user["id"],
    }


@router.post("/generate-sql")
def generate_sql_from_question(
    payload: QuestionRequest,
    current_user: dict = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail=bilingual("empty_question"))

    lang = detect_language(payload.question)

    try:
        sql = generate_sql(payload.question)
    except Exception as error:
        detail = bilingual("ollama_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=500, detail=detail) from error

    return {
        "question": payload.question,
        "language": lang,
        "sql": sql,
    }


@router.post("/analyze")
def analyze_question(
    payload: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail=bilingual("empty_question"))

    lang = detect_language(payload.question)

    try:
        sql = generate_sql(payload.question)
    except Exception as error:
        detail = bilingual("ollama_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=500, detail=detail) from error

    try:
        data = execute_select(db, sql)
    except HTTPException:
        db.rollback()
        try:
            sql = generate_sql(payload.question)
            data = execute_select(db, sql)
        except HTTPException:
            raise

    safe_data = to_jsonable(data)
    kpis = compute_kpis(safe_data)

    try:
        interpretation = interpret_results(payload.question, safe_data, kpis)
    except Exception as error:
        detail = bilingual("ollama_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=500, detail=detail) from error

    chart_type = detect_chart_type(safe_data)

    response = {
        "question": payload.question,
        "language": lang,
        "sql": sql,
        "data": safe_data,
        "kpis": kpis,
        "chart_type": chart_type,
        "interpretation": interpretation,
    }

    try:
        analysis_id = save_analysis(
            db=db,
            user_id=current_user["id"],
            question=payload.question,
            sql=sql,
            chart_type=chart_type,
            interpretation=interpretation,
            result_payload=response,
        )
        response["id"] = analysis_id
    except Exception:
        db.rollback()

    return response


@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return {"history": list_history(db, current_user["id"])}


@router.get("/history/{analysis_id}")
def get_history_item(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = get_analysis(db, current_user["id"], analysis_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail={
                "fr": "Analyse introuvable",
                "en": "Analysis not found",
            },
        )
    return item
