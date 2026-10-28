from datetime import date, datetime
from decimal import Decimal

import numpy as np

from app.services.messages import detect_language
from app.services.ollama import ask_mistral


def to_jsonable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    return value


def extract_label(row: dict):
    label_keys = [
        "name",
        "region",
        "category",
        "product",
        "product_name",
        "produit",
        "month",
        "mois",
    ]

    for key in label_keys:
        if row.get(key) is not None:
            return str(row[key])

    for key, value in row.items():
        if key.lower().endswith("id"):
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def extract_numeric(row: dict, keys: list[str]):
    for key in keys:
        value = row.get(key)

        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return value

    return None


def compute_kpis(data: list[dict]) -> dict:
    safe_data = to_jsonable(data)

    if not safe_data:
        return {
            "row_count": 0,
            "total_amount": None,
            "total_quantity": None,
            "average": None,
            "minimum": None,
            "maximum": None,
            "median": None,
            "top_item": None,
            "distribution": [],
        }

    amount_keys = [
        "total_amount",
        "total_sales",
        "total_ventes",
        "revenue",
        "chiffre_affaires",
        "total_profit",
        "profit",
        "total_cost",
        "cost",
    ]

    quantity_keys = [
        "total_quantity",
        "quantity",
        "qty",
        "total_sold",
        "total_sales_per_region",
    ]

    total_amount = 0.0
    total_quantity = 0.0
    has_amount = False
    has_quantity = False
    top_item = None
    top_value = None
    top_metric = None
    amount_values: list[float] = []
    distribution_rows: list[dict] = []

    for row in safe_data:
        amount = extract_numeric(row, amount_keys)
        quantity = extract_numeric(row, quantity_keys)

        if amount is not None:
            total_amount += float(amount)
            has_amount = True
            amount_values.append(float(amount))

        if quantity is not None:
            total_quantity += float(quantity)
            has_quantity = True

        metric_value = amount if amount is not None else quantity
        metric_name = "amount" if amount is not None else "quantity"
        label = extract_label(row)

        if metric_value is not None:
            distribution_rows.append(
                {
                    "label": label or "—",
                    "value": float(metric_value),
                    "metric": metric_name,
                }
            )
            if top_value is None or metric_value > top_value:
                top_value = metric_value
                top_metric = metric_name
                top_item = {
                    "label": label,
                    "value": float(metric_value),
                    "metric": metric_name,
                }

    average = None
    minimum = None
    maximum = None
    median = None
    if amount_values:
        sorted_vals = sorted(amount_values)
        average = sum(sorted_vals) / len(sorted_vals)
        minimum = sorted_vals[0]
        maximum = sorted_vals[-1]
        mid = len(sorted_vals) // 2
        if len(sorted_vals) % 2:
            median = sorted_vals[mid]
        else:
            median = (sorted_vals[mid - 1] + sorted_vals[mid]) / 2

    # Percent shares for pie chart
    dist_total = sum(item["value"] for item in distribution_rows) or 0.0
    distribution = []
    for item in sorted(distribution_rows, key=lambda x: x["value"], reverse=True):
        share = round((item["value"] / dist_total) * 100, 1) if dist_total else 0.0
        distribution.append(
            {
                "label": item["label"],
                "value": item["value"],
                "share": share,
                "metric": item["metric"],
            }
        )

    return {
        "row_count": len(safe_data),
        "total_amount": total_amount if has_amount else None,
        "total_quantity": total_quantity if has_quantity else None,
        "average": average,
        "minimum": minimum,
        "maximum": maximum,
        "median": median,
        "top_item": top_item,
        "top_metric": top_metric,
        "distribution": distribution,
    }


def build_analysis_charts(data: list[dict], kpis: dict, language: str = "fr") -> list[dict]:
    """Build bar + pie charts with percentages for the chat response."""
    charts: list[dict] = []
    distribution = kpis.get("distribution") or []

    if distribution and len(distribution) >= 1:
        labels = [str(item["label"]) for item in distribution[:10]]
        values = [float(item["value"]) for item in distribution[:10]]
        shares = [float(item.get("share") or 0) for item in distribution[:10]]

        charts.append(
            {
                "type": "pie",
                "title": (
                    "Répartition (%)"
                    if language != "en"
                    else "Share (%)"
                ),
                "labels": labels,
                "values": values,
                "shares": shares,
                "show_percent": True,
            }
        )

        if len(distribution) >= 2:
            charts.append(
                {
                    "type": "bar",
                    "title": (
                        "Comparaison des valeurs"
                        if language != "en"
                        else "Value comparison"
                    ),
                    "labels": labels,
                    "values": values,
                }
            )
        return charts

    # Fallback from raw rows
    safe = to_jsonable(data)
    if not safe:
        return charts

    label = extract_label(safe[0])
    # Prefer amount/quantity columns
    value_keys = [
        "total_amount",
        "total_sales",
        "total_ventes",
        "revenue",
        "total_quantity",
        "quantity",
    ]
    value_key = next(
        (k for k in value_keys if any(isinstance(r.get(k), (int, float)) for r in safe)),
        None,
    )
    label_key = next(
        (
            k
            for k in ["name", "region", "product", "produit", "category"]
            if any(isinstance(r.get(k), str) for r in safe)
        ),
        None,
    )
    if not value_key or not label_key:
        return charts

    labels = [str(r.get(label_key)) for r in safe[:10]]
    values = [float(r.get(value_key) or 0) for r in safe[:10]]
    total = sum(values) or 1.0
    shares = [round(v / total * 100, 1) for v in values]

    charts.append(
        {
            "type": "pie",
            "title": "Répartition (%)" if language != "en" else "Share (%)",
            "labels": labels,
            "values": values,
            "shares": shares,
            "show_percent": True,
        }
    )
    charts.append(
        {
            "type": "bar",
            "title": "Comparaison" if language != "en" else "Comparison",
            "labels": labels,
            "values": values,
        }
    )
    return charts


def build_kpi_bubbles(kpis: dict, language: str = "fr") -> list[dict]:
    """Chart-only KPI bubbles for SQL analysis."""
    lbl = {
        "distribution": "Camembert — Répartition (%)" if language != "en" else "Pie — Share (%)",
        "summary": "Résumé KPI" if language != "en" else "KPI summary",
        "histogram": "Histogramme des valeurs" if language != "en" else "Value histogram",
        "combo": "Combo — Comparaison" if language != "en" else "Combo — Comparison",
    }
    bubbles: list[dict] = []

    summary_labels: list[str] = []
    summary_values: list[float] = []
    if language == "en":
        mapping = [
            ("total_amount", "Revenue"),
            ("average", "Average"),
            ("minimum", "Min"),
            ("maximum", "Max"),
            ("median", "Median"),
            ("total_quantity", "Quantity"),
        ]
    else:
        mapping = [
            ("total_amount", "CA"),
            ("average", "Moyenne"),
            ("minimum", "Min"),
            ("maximum", "Max"),
            ("median", "Médiane"),
            ("total_quantity", "Quantité"),
        ]
    for key, label in mapping:
        val = kpis.get(key)
        if val is not None:
            summary_labels.append(label)
            summary_values.append(float(val))

    if len(summary_labels) >= 2:
        bubbles.append(
            {
                "id": "kpi_summary",
                "label": lbl["summary"],
                "kind": "chart",
                "chart": {
                    "type": "bar",
                    "title": lbl["summary"],
                    "labels": summary_labels,
                    "values": summary_values,
                },
            }
        )

    dist = kpis.get("distribution") or []
    if dist and len(dist) >= 2:
        labels = [str(item["label"]) for item in dist[:8]]
        values = [float(item["value"]) for item in dist[:8]]
        shares = [float(item.get("share") or 0) for item in dist[:8]]
        bubbles.append(
            {
                "id": "distribution_pie",
                "label": lbl["distribution"],
                "kind": "chart",
                "chart": {
                    "type": "pie",
                    "title": lbl["distribution"],
                    "labels": labels,
                    "values": values,
                    "shares": shares,
                    "show_percent": True,
                },
            }
        )
        if len(values) >= 3:
            counts, edges = np.histogram(values, bins=min(6, len(values)))
            hist_labels = [
                f"{edges[i]:,.0f}–{edges[i + 1]:,.0f}" for i in range(len(counts))
            ]
            bubbles.append(
                {
                    "id": "distribution_hist",
                    "label": lbl["histogram"],
                    "kind": "chart",
                    "chart": {
                        "type": "histogram",
                        "title": lbl["histogram"],
                        "labels": hist_labels,
                        "values": [int(c) for c in counts.tolist()],
                    },
                }
            )
        cumulative: list[float] = []
        running = 0.0
        for v in values:
            running += v
            cumulative.append(running)
        bubbles.append(
            {
                "id": "distribution_combo",
                "label": lbl["combo"],
                "kind": "chart",
                "chart": {
                    "type": "combo",
                    "title": lbl["combo"],
                    "labels": labels,
                    "values": values,
                    "line_values": cumulative,
                },
            }
        )
        bubbles.append(
            {
                "id": "distribution_bar",
                "label": lbl["combo"].replace("Combo", "Barres").replace("Combo", "Bars"),
                "kind": "chart",
                "chart": {
                    "type": "bar",
                    "title": "Comparaison des valeurs" if language != "en" else "Value comparison",
                    "labels": labels,
                    "values": values,
                },
            }
        )

    return bubbles


def is_more_interpretation_request(question: str) -> bool:
    q = question.lower().strip()
    keywords = [
        "plus d'interprétation",
        "plus d interpretation",
        "plus d interprétation",
        "plus d'interpretation",
        "plus d interpretations",
        "plus d'interprétations",
        "interprétation plus",
        "interpretation plus",
        "plus de détails",
        "plus de details",
        "explique plus",
        "explique-moi plus",
        "explique moi plus",
        "analyse plus",
        "plus d analyse",
        "plus d'analyse",
        "interprétation complète",
        "interpretation complete",
        "more interpretation",
        "more details",
        "explain more",
        "deeper analysis",
        "plus d interpretation dans le chat",
        "plus d'interpretation dans le chat",
        "donne moi plus",
        "plus long",
        "détaille",
        "detaille",
    ]
    return any(k in q for k in keywords)


def interpret_results(
    question: str,
    data: list[dict],
    kpis: dict,
    detailed: bool | None = None,
    language: str | None = None,
) -> str:
    # Si la langue est déjà résolue par l'appelant, on la respecte.
    lang = language if language in ("fr", "en") else detect_language(question)
    safe_kpis = to_jsonable(kpis)
    safe_data = to_jsonable(data)
    if detailed is None:
        detailed = is_more_interpretation_request(question)
    text = _rich_interpretation(lang, safe_kpis, safe_data, detailed=detailed)
    if detailed:
        try:
            sample = safe_data[:8]
            prompt = f"""
You are CAP AI commercial analyst. Write the interpretation STRICTLY in {"English" if lang == "en" else "French"}.
Do not mix languages. Use ONLY these numbers. Do not invent anything.
Question: {question}
KPIs: {safe_kpis}
Sample: {sample}
Structure: 1) overall Sales/Cost/Profit 2) leading region 3) gaps 4) data quality 5) actionable recommendation.
""".strip()
            if lang == "fr":
                prompt = f"""
Tu es analyste commercial pour CAP AI. Rédige une interprétation STRICTEMENT en français.
N'utilise pas l'anglais. Utilise UNIQUEMENT ces chiffres. N'invente rien.
Question: {question}
KPIs: {safe_kpis}
Aperçu: {sample}
Structure: 1) constat global Sales/Cost/Profit 2) région dominante 3) écarts 4) qualité des données 5) recommandation actionnable.
""".strip()
            ai_text = ask_mistral(prompt, timeout=20.0, num_predict=360)
            if ai_text and len(ai_text) > 80:
                return ai_text.strip()
        except Exception:
            pass
    return text


def _rich_interpretation(
    lang: str, kpis: dict, data: list[dict], detailed: bool = False
) -> str:
    total = kpis.get("total_amount")
    qty = kpis.get("total_quantity")
    top = kpis.get("top_item")
    dist = kpis.get("distribution") or []
    avg = kpis.get("average")
    minimum = kpis.get("minimum")
    maximum = kpis.get("maximum")
    rows = kpis.get("row_count") or 0

    sep = "\n\n" if detailed else " "

    if lang == "en":
        parts = []
        if total is not None:
            parts.append(f"Total sales amount to {float(total):,.2f}.")
        if qty is not None:
            parts.append(f"This covers {qty} transactions.")
        if isinstance(top, dict) and top.get("label"):
            share = dist[0].get("share") if dist else None
            extra = f" ({share}% of the total)" if share is not None else ""
            parts.append(f"The leading item is {top['label']}{extra}.")
        if detailed:
            if avg is not None:
                parts.append(f"The average ticket is {float(avg):,.2f}.")
            if minimum is not None and maximum is not None:
                parts.append(
                    f"Values range from {float(minimum):,.2f} to {float(maximum):,.2f}."
                )
            if len(dist) >= 2:
                weak = dist[-1]
                parts.append(
                    f"{weak.get('label')} is the weakest contributor ({weak.get('share')}%)."
                )
            if len(dist) >= 3:
                mid = ", ".join(str(item.get("label")) for item in dist[1:4])
                parts.append(f"Other notable segments: {mid}.")
            parts.append(
                "Data quality: the source file (difficult_dataset) can contain missing Sales/Cost/Profit values, noisy MixedColumn entries (error, N/A, 42) and extra spaces in Description."
            )
            parts.append(
                "Recommendation: focus commercial actions on the leading region, investigate low performers, and clean missing numeric fields before forecasting."
            )
        if not parts:
            parts.append(f"Analysis completed on {rows} row(s).")
        return sep.join(parts)

    parts = []
    if total is not None:
        parts.append(
            f"Le montant total des ventes (Sales) s'élève à {float(total):,.2f}."
        )
    if qty is not None:
        parts.append(f"Cela correspond à {qty} transactions du jeu de données.")
    if isinstance(top, dict) and top.get("label"):
        share = dist[0].get("share") if dist else None
        extra = f" ({share}% du total)" if share is not None else ""
        parts.append(f"L'élément / la région dominante est {top['label']}{extra}.")
    if detailed:
        if avg is not None:
            parts.append(f"Le ticket moyen est de {float(avg):,.2f}.")
        if minimum is not None and maximum is not None:
            parts.append(
                f"Les valeurs vont de {float(minimum):,.2f} à {float(maximum):,.2f}, ce qui montre une forte hétérogénéité entre lignes."
            )
        if len(dist) >= 2:
            weak = dist[-1]
            parts.append(
                f"{weak.get('label')} contribue le moins ({weak.get('share')}%)."
            )
        if len(dist) >= 3:
            mid = ", ".join(str(item.get("label")) for item in dist[1:4])
            parts.append(f"Autres segments notables : {mid}.")
        parts.append(
            "Qualité des données : le fichier source (difficult_dataset) contient des valeurs Sales/Cost/Profit parfois vides, une colonne MixedColumn bruitée (error, N/A, 42, OK) et des descriptions avec espaces superflus."
        )
        parts.append(
            "Recommandation : concentrer les actions commerciales sur la région leader, investiguer les zones faibles (ex. International), et nettoyer les champs numériques manquants avant toute prévision."
        )
    if not parts:
        parts.append(f"Analyse terminée sur {rows} ligne(s).")
    return sep.join(parts)


def _fast_interpretation(lang: str, kpis: dict) -> str:
    return _rich_interpretation(lang, kpis, [], detailed=False)