from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.interpreter import compute_kpis, interpret_results
from app.services.messages import bilingual, detect_language
from app.services.ollama import ask_mistral
from app.services.sql_executor import execute_select
from app.services.sql_generator import generate_sql

router = APIRouter(prefix="/ai", tags=["ai"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_ai(payload: QuestionRequest):
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
    }


@router.post("/generate-sql")
def generate_sql_from_question(payload: QuestionRequest):
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
def analyze_question(payload: QuestionRequest, db: Session = Depends(get_db)):
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

    data = execute_select(db, sql)
    kpis = compute_kpis(data)

    try:
        interpretation = interpret_results(payload.question, data, kpis)
    except Exception as error:
        detail = bilingual("ollama_error")
        detail["fr"] = f"{detail['fr']}: {error}"
        detail["en"] = f"{detail['en']}: {error}"
        raise HTTPException(status_code=500, detail=detail) from error

    return {
        "question": payload.question,
        "language": lang,
        "sql": sql,
        "data": data,
        "kpis": kpis,
        "interpretation": interpretation,
    }