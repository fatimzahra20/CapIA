"""File analysis API: upload, profile, clean, analyze, ask, export."""

from __future__ import annotations

import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth import get_current_user
from app.services.history import save_analysis
from app.services.file_analytics import (
    build_all_kpi_charts,
    build_kpi_bubbles,
    compute_file_kpis,
)
from app.services.file_cleaner import analyze_and_clean
from app.services.file_parser import parse_upload
from app.services.file_profiler import dataframe_preview, profile_dataframe
from app.services.file_qa import answer_question
from app.services.file_store import create_session, get_session, update_cleaned
from app.services.file_suggestions import generate_file_suggestions

router = APIRouter(prefix="/files", tags=["files"])

MAX_SIZE = 15 * 1024 * 1024  # 15 MB


class AskRequest(BaseModel):
    question: str
    language: str | None = None


def _session_or_404(file_id: str, user_id: int):
    session = get_session(file_id, user_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail={
                "fr": "Fichier introuvable ou expiré. Réimportez le fichier.",
                "en": "File not found or expired. Please re-upload the file.",
            },
        )
    return session


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    filename = file.filename or "fichier"
    content = await file.read()
    size = len(content)

    if size == 0:
        raise HTTPException(
            status_code=400,
            detail={"fr": "Fichier vide.", "en": "Empty file."},
        )
    if size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail={
                "fr": "Fichier trop volumineux (max 15 Mo).",
                "en": "File too large (max 15 MB).",
            },
        )

    df = parse_upload(filename, content)
    profile = profile_dataframe(df)
    try:
        session = create_session(
            user_id=current_user["id"],
            filename=filename,
            content_type=file.content_type or "application/octet-stream",
            size_bytes=size,
            df=df,
            profile=profile,
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail={
                "fr": f"Erreur lors de l'enregistrement du fichier: {error}",
                "en": f"Error while saving the file: {error}",
            },
        ) from error

    return {
        "file_id": session.file_id,
        "filename": filename,
        "size_bytes": size,
        "content_type": session.content_type,
        "profile": profile,
        "preview": dataframe_preview(df),
        "suggestions": generate_file_suggestions(profile, "fr"),
    }


@router.get("/{file_id}")
def get_file_meta(file_id: str, current_user: dict = Depends(get_current_user)):
    session = _session_or_404(file_id, current_user["id"])
    df = session.active_df()
    return {
        "file_id": session.file_id,
        "filename": session.filename,
        "size_bytes": session.size_bytes,
        "content_type": session.content_type,
        "cleaned": session.cleaned_df is not None,
        "profile": session.profile or profile_dataframe(df),
        "preview": dataframe_preview(df),
        "cleaning_report": session.cleaning_report,
    }


@router.post("/{file_id}/clean")
def clean_file(file_id: str, current_user: dict = Depends(get_current_user)):
    session = _session_or_404(file_id, current_user["id"])
    cleaned_df, report = analyze_and_clean(session.df)
    update_cleaned(
        file_id,
        current_user["id"],
        cleaned_df,
        report,
        report["profile"],
    )
    return {
        "file_id": file_id,
        "report": report,
        "preview": dataframe_preview(cleaned_df),
        "profile": report["profile"],
    }


@router.post("/{file_id}/analyze")
def analyze_file(
    file_id: str,
    language: str | None = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.messages import resolve_language

    lang = resolve_language("", language)
    session = _session_or_404(file_id, current_user["id"])
    df = session.active_df()
    profile = session.profile or profile_dataframe(df)
    kpis = compute_file_kpis(df)
    kpi_bubbles = build_kpi_bubbles(df, kpis, lang)
    charts = build_all_kpi_charts(df, kpis, lang)
    suggestions = generate_file_suggestions(profile, lang)
    response = {
        "file_id": file_id,
        "filename": session.filename,
        "profile": profile,
        "kpis": kpis,
        "kpi_bubbles": kpi_bubbles,
        "charts": charts,
        "interpretation": (
            "Graphiques KPI générés." if lang == "fr" else "KPI charts generated."
        ),
        "suggestions": suggestions,
        "preview": dataframe_preview(df, limit=12),
        "cleaned": session.cleaned_df is not None,
        "mode": "dashboard",
        "charts_only": True,
        "language": lang,
        "source": "file",
    }
    try:
        analysis_id = save_analysis(
            db=db,
            user_id=current_user["id"],
            question=f"Dashboard — {session.filename}",
            sql="",
            chart_type="dashboard",
            interpretation=response["interpretation"],
            result_payload=response,
        )
        response["id"] = analysis_id
    except Exception:
        db.rollback()
    return response


def _fallback_interpretation(filename: str, kpis: dict) -> str:
    parts = [f"Analyse du fichier « {filename} » terminée."]
    if kpis.get("total_revenue") is not None:
        parts.append(
            f"Le chiffre d'affaires total détecté est de {kpis['total_revenue']:,.2f}."
        )
    if kpis.get("top_region"):
        top = kpis["top_region"]
        share = f" ({top.get('share')}% du CA)" if top.get("share") is not None else ""
        parts.append(f"La meilleure région est « {top['label']} »{share}.")
    if kpis.get("top_product"):
        top = kpis["top_product"]
        parts.append(f"Le produit le plus important est « {top['label']} ».")
    if kpis.get("total_quantity") is not None:
        parts.append(f"La quantité totale s'élève à {kpis['total_quantity']:,.0f}.")
    if len(parts) == 1:
        parts.append(
            "Les indicateurs ont été calculés automatiquement selon les colonnes détectées."
        )
    return " ".join(parts)


@router.post("/{file_id}/ask")
def ask_file(
    file_id: str,
    payload: AskRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.question.strip():
        raise HTTPException(
            status_code=400,
            detail={"fr": "Question vide.", "en": "Empty question."},
        )
    session = _session_or_404(file_id, current_user["id"])
    from app.services.messages import resolve_language

    # Toujours suivre la langue de la question (pas celle de l'UI).
    lang = resolve_language(payload.question, payload.language)
    result = answer_question(
        session.active_df(),
        payload.question.strip(),
        language=lang,
    )
    result["file_id"] = file_id
    result["filename"] = session.filename
    result["source"] = "file"
    try:
        analysis_id = save_analysis(
            db=db,
            user_id=current_user["id"],
            question=payload.question.strip(),
            sql="",
            chart_type="file",
            interpretation=result.get("answer") or "",
            result_payload=result,
        )
        result["id"] = analysis_id
    except Exception:
        db.rollback()
    return result


@router.get("/{file_id}/export")
def export_clean_dataset(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    session = _session_or_404(file_id, current_user["id"])
    df = session.active_df()
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    base = session.filename.rsplit(".", 1)[0]
    out_name = f"{base}_clean.csv"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
    )
