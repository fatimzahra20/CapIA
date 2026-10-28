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
from app.services.interpreter import (
    build_analysis_charts,
    build_kpi_bubbles,
    compute_kpis,
    interpret_results,
    is_more_interpretation_request,
    to_jsonable,
)
from app.services.file_suggestions import (
    detect_requested_chart_types,
    filter_visuals_by_type,
    is_kpi_charts_request,
)
from app.services.messages import bilingual, resolve_language
from app.services.suggestions import generate_db_suggestions, generate_followup_suggestions
from app.services.ollama import ask_mistral
from app.services.sql_executor import execute_select
from app.services.sql_generator import generate_sql, match_template_sql

router = APIRouter(prefix="/ai", tags=["ai"])


class QuestionRequest(BaseModel):
    question: str
    language: str | None = None


@router.post("/ask")
def ask_ai(
    payload: QuestionRequest,
    current_user: dict = Depends(get_current_user),
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail=bilingual("empty_question"))

    lang = resolve_language(payload.question, payload.language)

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

    lang = resolve_language(payload.question, payload.language)

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

    lang = resolve_language(payload.question, payload.language)

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
            # Prefer template / fallback SQL on retry instead of another slow Ollama call
            sql = match_template_sql(payload.question) or generate_sql(
                "ventes par région"
            )
            data = execute_select(db, sql)
        except HTTPException:
            raise

    safe_data = to_jsonable(data)
    kpis = compute_kpis(safe_data)
    charts = build_analysis_charts(safe_data, kpis, lang)
    kpi_bubbles = build_kpi_bubbles(kpis, lang)
    wanted_types = detect_requested_chart_types(payload.question)
    more_text = is_more_interpretation_request(payload.question)
    charts_only = (
        (is_kpi_charts_request(payload.question) or bool(wanted_types))
        and not more_text
    )

    if charts_only:
        charts = [b["chart"] for b in kpi_bubbles if b.get("chart")] + charts
        kpi_bubbles, charts = filter_visuals_by_type(
            kpi_bubbles, charts, wanted_types
        )
        if wanted_types == ["pie"]:
            interpretation = (
                "Voici le KPI en camembert (pie chart)."
                if lang == "fr"
                else "Here is the KPI as a pie chart."
            )
        elif wanted_types:
            interpretation = (
                "Voici le graphique demandé."
                if lang == "fr"
                else "Here is the requested chart."
            )
        else:
            interpretation = (
                "Graphiques KPI générés." if lang == "fr" else "KPI charts generated."
            )
    else:
        if wanted_types:
            kpi_bubbles, charts = filter_visuals_by_type(
                kpi_bubbles, charts, wanted_types
            )
        try:
            interpretation = interpret_results(
                payload.question, safe_data, kpis, language=lang
            )
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
        "kpis": kpis,
        "kpi_bubbles": [] if more_text else kpi_bubbles,
        "charts": [] if more_text else charts,
        "charts_only": charts_only and not more_text,
        "interpretation_only": more_text,
        "data": [] if more_text else safe_data,
        "chart_type": chart_type,
        "interpretation": interpretation,
        "interpretation_expanded": more_text,
        "suggestions": generate_followup_suggestions(
            payload.question, source="database", lang=lang
        ),
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


class InterpretRequest(BaseModel):
    question: str
    kpis: dict = {}
    data: list[dict] = []
    language: str | None = None


@router.post("/interpret")
def expand_interpretation(
    payload: InterpretRequest,
    current_user: dict = Depends(get_current_user),
):
    lang = resolve_language(
        payload.question or "plus d'interprétation", payload.language
    )
    text = interpret_results(
        payload.question or "plus d'interprétation",
        payload.data or [],
        payload.kpis or {},
        detailed=True,
        language=lang,
    )
    return {
        "language": lang,
        "interpretation": text,
        "interpretation_expanded": True,
        "charts_only": False,
    }


@router.get("/suggestions")
def get_suggestions(
    lang: str = "fr",
    current_user: dict = Depends(get_current_user),
):
    chosen = lang if lang in ("fr", "en") else "fr"
    return {
        "suggestions": generate_db_suggestions(chosen, count=5),
        "language": chosen,
        "random": True,
    }


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
