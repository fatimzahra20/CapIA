from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ollama import ask_mistral

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