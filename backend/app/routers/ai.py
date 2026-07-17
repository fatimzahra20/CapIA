from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ollama import ask_mistral
from app.services.sql_executor import execute_select
from app.services.sql_generator import generate_sql

router = APIRouter(prefix="/ai", tags=["ai"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/ask")
def ask_ai(payload: QuestionRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La question est vide")

    try:
        answer = ask_mistral(payload.question)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erreur Ollama: {error}") from error

    return {
        "question": payload.question,
        "answer": answer,
    }


@router.post("/generate-sql")
def generate_sql_from_question(payload: QuestionRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La question est vide")

    try:
        sql = generate_sql(payload.question)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erreur Ollama: {error}") from error

    return {
        "question": payload.question,
        "sql": sql,
    }


@router.post("/analyze")
def analyze_question(payload: QuestionRequest, db: Session = Depends(get_db)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La question est vide")

    try:
        sql = generate_sql(payload.question)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erreur Ollama: {error}") from error

    data = execute_select(db, sql)

    return {
        "question": payload.question,
        "sql": sql,
        "data": data,
    }