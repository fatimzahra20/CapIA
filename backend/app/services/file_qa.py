"""Natural-language Q&A over an uploaded DataFrame (no PostgreSQL)."""

from __future__ import annotations

import json
from typing import Any

import pandas as pd

from app.services.file_analytics import (
    build_all_kpi_charts,
    build_kpi_bubbles,
    compute_file_kpis,
    safe_records,
)
from app.services.file_profiler import profile_dataframe
from app.services.file_suggestions import (
    detect_requested_chart_types,
    filter_visuals_by_type,
    is_kpi_charts_request,
)
from app.services.interpreter import interpret_results, is_more_interpretation_request
from app.services.messages import resolve_language
from app.services.suggestions import generate_followup_suggestions
from app.services.ollama import ask_mistral


def _to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def _role_col(roles: dict[str, str], role: str) -> str | None:
    for col, value in roles.items():
        if value == role:
            return col
    return None


def answer_question(
    df: pd.DataFrame, question: str, language: str | None = None
) -> dict[str, Any]:
    lang = language if language in ("fr", "en") else resolve_language(question, None)
    profile = profile_dataframe(df)
    roles = profile["roles"]
    kpis = compute_file_kpis(df)
    q = question.lower()

    if is_more_interpretation_request(question):
        mapped = {
            **kpis,
            "total_amount": kpis.get("total_revenue"),
            "total_quantity": kpis.get("total_quantity") or kpis.get("sales_count"),
        }
        if kpis.get("top_region"):
            mapped["top_item"] = kpis["top_region"]
        text = interpret_results(
            question,
            safe_records(df, limit=12),
            mapped,
            detailed=True,
            language=lang,
        )
        return {
            "language": lang,
            "answer": text,
            "direct_answer": None,
            "kpis": kpis,
            "kpi_bubbles": [],
            "charts": [],
            "data": [],
            "chart": None,
            "source": "file",
            "charts_only": False,
            "interpretation_only": True,
            "interpretation_expanded": True,
            "suggestions": generate_followup_suggestions(
                question, source="file", lang=lang, profile=profile
            ),
        }

    if is_kpi_charts_request(question):
        bubbles = build_kpi_bubbles(df, kpis, lang)
        charts = build_all_kpi_charts(df, kpis, lang)
        wanted_types = detect_requested_chart_types(question)
        bubbles, charts = filter_visuals_by_type(bubbles, charts, wanted_types)
        if wanted_types == ["pie"]:
            answer = (
                "Voici le KPI en camembert (pie chart)."
                if lang == "fr"
                else "Here is the KPI as a pie chart."
            )
        elif wanted_types:
            answer = (
                "Voici le graphique demandé."
                if lang == "fr"
                else "Here is the requested chart."
            )
        else:
            answer = (
                "Graphiques KPI générés." if lang == "fr" else "KPI charts generated."
            )
        return {
            "language": lang,
            "answer": answer,
            "direct_answer": None,
            "kpis": kpis,
            "kpi_bubbles": bubbles,
            "charts": charts,
            "data": [],
            "chart": charts[0] if charts else None,
            "source": "file",
            "charts_only": True,
            "mode": "kpi_charts",
            "suggestions": generate_followup_suggestions(
                question, source="file", lang=lang, profile=profile
            ),
        }

    revenue_col = kpis.get("revenue_column") or _role_col(roles, "revenue")
    product_col = _role_col(roles, "product")
    region_col = _role_col(roles, "region")
    customer_col = _role_col(roles, "customer")
    date_col = _role_col(roles, "date")

    data_table: list[dict[str, Any]] = []
    chart: dict[str, Any] | None = None
    direct_answer: str | None = None

    if any(
        w in q
        for w in [
            "chiffre d'affaires",
            "chiffre d affaires",
            "revenue",
            "total sales",
            "ca total",
        ]
    ):
        value = kpis.get("total_revenue")
        if value is not None:
            direct_answer = (
                f"Le chiffre d'affaires total est de {value:,.2f}."
                if lang == "fr"
                else f"Total revenue is {value:,.2f}."
            )

    elif any(
        w in q
        for w in ["produit le plus", "best product", "top product", "plus vendu"]
    ):
        top = kpis.get("top_product")
        if top:
            direct_answer = (
                f"Le produit le plus vendu (en CA) est « {top['label']} » ({top['value']:,.2f})."
                if lang == "fr"
                else f"The top product by revenue is “{top['label']}” ({top['value']:,.2f})."
            )

    elif any(
        w in q
        for w in [
            "meilleure région",
            "meilleure region",
            "best region",
            "région",
            "region",
        ]
    ):
        if "meilleur" in q or "best" in q or "plus" in q:
            top = kpis.get("top_region")
            if top:
                share = top.get("share")
                if share is None:
                    share_txt = ""
                elif lang == "fr":
                    share_txt = f" ({share}% du CA)"
                else:
                    share_txt = f" ({share}% of revenue)"
                direct_answer = (
                    f"La meilleure région est « {top['label']} » avec {top['value']:,.2f}{share_txt}."
                    if lang == "fr"
                    else f"The top region is “{top['label']}” with {top['value']:,.2f}{share_txt}."
                )
        elif region_col and revenue_col:
            grouped = (
                df.assign(_rev=_to_numeric(df[revenue_col]))
                .groupby(region_col, dropna=True)["_rev"]
                .sum()
                .sort_values(ascending=False)
            )
            data_table = [
                {region_col: str(idx), "total": float(val)}
                for idx, val in grouped.items()
            ]
            chart = {
                "type": "bar",
                "title": "Ventes par région" if lang == "fr" else "Sales by region",
                "labels": [str(i) for i in grouped.index],
                "values": [float(v) for v in grouped.values],
            }
            direct_answer = (
                "Voici les ventes par région."
                if lang == "fr"
                else "Here are sales by region."
            )

    elif any(
        w in q
        for w in ["meilleurs clients", "top clients", "best customers", "10 meilleurs"]
    ):
        if customer_col and revenue_col:
            grouped = (
                df.assign(_rev=_to_numeric(df[revenue_col]))
                .groupby(customer_col, dropna=True)["_rev"]
                .sum()
                .sort_values(ascending=False)
                .head(10)
            )
            data_table = [
                {customer_col: str(idx), "total": float(val)}
                for idx, val in grouped.items()
            ]
            chart = {
                "type": "bar",
                "title": "Top 10 clients",
                "labels": [str(i) for i in grouped.index],
                "values": [float(v) for v in grouped.values],
            }
            direct_answer = (
                "Voici les 10 meilleurs clients."
                if lang == "fr"
                else "Here are the top 10 customers."
            )

    elif any(
        w in q for w in ["par mois", "by month", "évolution", "evolution", "mensuel"]
    ):
        evo = kpis.get("sales_evolution") or []
        if evo:
            data_table = evo
            chart = {
                "type": "line",
                "title": "Ventes par mois" if lang == "fr" else "Sales by month",
                "labels": [p["period"] for p in evo],
                "values": [p["value"] for p in evo],
                "area": True,
            }
            direct_answer = (
                "Voici l'évolution des ventes par mois."
                if lang == "fr"
                else "Here is the monthly sales trend."
            )
        elif date_col and revenue_col:
            dates = pd.to_datetime(df[date_col], errors="coerce", dayfirst=True)
            temp = pd.DataFrame(
                {
                    "period": dates.dt.to_period("M").astype(str),
                    "value": _to_numeric(df[revenue_col]),
                }
            ).dropna()
            grouped = temp.groupby("period")["value"].sum().sort_index()
            data_table = [
                {"period": str(idx), "value": float(val)}
                for idx, val in grouped.items()
            ]
            chart = {
                "type": "line",
                "title": "Ventes par mois" if lang == "fr" else "Sales by month",
                "labels": [str(i) for i in grouped.index],
                "values": [float(v) for v in grouped.values],
                "area": True,
            }
            direct_answer = (
                "Voici les ventes par mois."
                if lang == "fr"
                else "Here are sales by month."
            )

    elif any(w in q for w in ["quantité", "quantite", "quantity", "unités", "unites"]):
        value = kpis.get("total_quantity")
        if value is not None:
            direct_answer = (
                f"La quantité totale est de {value:,.0f}."
                if lang == "fr"
                else f"Total quantity is {value:,.0f}."
            )

    interpretation = direct_answer or _kpi_summary(lang, kpis)

    # Only call Mistral when we have no deterministic answer, and keep it short
    if not direct_answer:
        sample = safe_records(df, limit=8)
        kpi_json = json.dumps(kpis, ensure_ascii=False, default=str)
        cols = list(df.columns)
        sample_json = json.dumps(sample, ensure_ascii=False, default=str)
        if lang == "en":
            prompt = f"""
You are CAP AI. Answer STRICTLY in English in 2 sentences max.
Use ONLY these facts. Do not invent numbers. Do not use French.
Question: {question}
KPIs: {kpi_json}
Columns: {cols}
Sample: {sample_json}
""".strip()
        else:
            prompt = f"""
Tu es CAP AI. Réponds STRICTEMENT en français en 2 phrases max.
Utilise UNIQUEMENT ces infos. N'invente aucun chiffre. N'utilise pas l'anglais.
Question: {question}
KPIs: {kpi_json}
Colonnes: {cols}
Aperçu: {sample_json}
""".strip()
        try:
            interpretation = (
                ask_mistral(prompt, timeout=12.0, num_predict=80) or interpretation
            )
        except Exception:
            pass

    return {
        "language": lang,
        "answer": interpretation,
        "direct_answer": direct_answer,
        "kpis": kpis,
        "kpi_bubbles": build_kpi_bubbles(df, kpis, lang),
        "data": data_table,
        "chart": chart,
        "source": "file",
        "suggestions": generate_followup_suggestions(
            question, source="file", lang=lang, profile=profile
        ),
    }


def _kpi_summary(lang: str, kpis: dict) -> str:
    if lang == "en":
        parts = []
        if kpis.get("total_revenue") is not None:
            parts.append(f"Total revenue: {kpis['total_revenue']:,.2f}.")
        if kpis.get("top_region"):
            parts.append(f"Top region: {kpis['top_region']['label']}.")
        if kpis.get("top_product"):
            parts.append(f"Top product: {kpis['top_product']['label']}.")
        return " ".join(parts) or "File analysis completed."

    parts = []
    if kpis.get("total_revenue") is not None:
        parts.append(f"Chiffre d'affaires total : {kpis['total_revenue']:,.2f}.")
    if kpis.get("top_region"):
        parts.append(f"Meilleure région : {kpis['top_region']['label']}.")
    if kpis.get("top_product"):
        parts.append(f"Meilleur produit : {kpis['top_product']['label']}.")
    return " ".join(parts) or "Analyse du fichier terminée."
