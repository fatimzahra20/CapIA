"""Generate dynamic question suggestions from file profile."""

from __future__ import annotations

from typing import Any


def generate_file_suggestions(profile: dict[str, Any], lang: str = "fr") -> list[str]:
    roles = profile.get("roles") or {}
    role_values = set(roles.values())

    suggestions: list[str] = []

    if lang == "en":
        if "revenue" in role_values:
            suggestions.append("What is the total revenue?")
        if "region" in role_values and "revenue" in role_values:
            suggestions.extend(
                [
                    "Sales by region",
                    "Best performing region",
                ]
            )
        if "product" in role_values:
            suggestions.append("Top selling product")
        if "customer" in role_values:
            suggestions.append("Top 10 customers")
        if "date" in role_values and "revenue" in role_values:
            suggestions.append("Monthly sales trend")
        if "quantity" in role_values:
            suggestions.append("Total quantity sold")
        suggestions.extend(
            [
                "Generate a full dashboard",
                "Show all KPIs as charts",
                "Summarize key insights from this file",
            ]
        )
    else:
        if "revenue" in role_values:
            suggestions.append("Quel est le chiffre d'affaires total ?")
        if "region" in role_values and "revenue" in role_values:
            suggestions.extend(
                [
                    "Ventes par région",
                    "Meilleure région",
                ]
            )
        if "product" in role_values:
            suggestions.append("Produit le plus vendu")
        if "customer" in role_values:
            suggestions.append("Top 10 meilleurs clients")
        if "date" in role_values and "revenue" in role_values:
            suggestions.append("Évolution des ventes par mois")
        if "quantity" in role_values:
            suggestions.append("Quantité totale vendue")
        suggestions.extend(
            [
                "Génère un tableau de bord complet",
                "Montre le KPI en pie chart",
                "Montre tous les KPI en graphiques",
                "Résume les points clés de ce fichier",
            ]
        )

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for item in suggestions:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique[:8]


def is_dashboard_request(question: str, filename: str = "") -> bool:
    q = question.lower().strip()
    name = filename.lower()

    dashboard_keywords = [
        "dashboard",
        "tableau de bord",
        "tableau de bord complet",
        "génère un dashboard",
        "genere un dashboard",
        "génère un tableau",
        "genere un tableau",
        "full dashboard",
        "complete dashboard",
        "analyse complète",
        "analyse complete",
        "analyse ce fichier",
        "analyze this file",
        "résume les points clés",
        "resume les points cles",
        "summarize the key insights",
        "summarize key insights",
        "points clés",
        "key insights",
    ]

    if any(k in q for k in dashboard_keywords):
        return True

    if name.endswith(".pdf") and len(q) < 120:
        generic = [
            "analyse",
            "analyze",
            "résume",
            "resume",
            "summarize",
            "dashboard",
            "tableau",
            "points clés",
            "key insights",
            "complet",
            "complete",
        ]
        if any(g in q for g in generic) or q.count(" ") < 12:
            return True

    return False


def detect_requested_chart_types(question: str) -> list[str] | None:
    """If the user asked for a specific chart type, return that type only.

    Returns None when no specific type is requested (show all).
    """
    q = question.lower().strip()
    wants_all = any(
        k in q
        for k in [
            "tous les kpi",
            "tous les graphiques",
            "tous les types",
            "all kpi",
            "all charts",
            "montre tous",
            "show all",
        ]
    )
    if wants_all:
        return None

    found: list[str] = []
    if any(
        k in q
        for k in [
            "pie",
            "camembert",
            "circulaire",
            "donut",
            "doughnut",
        ]
    ):
        found.append("pie")
    if any(k in q for k in ["histogramme", "histogram"]):
        found.append("histogram")
    if "combo" in q:
        found.append("combo")
    if any(
        k in q
        for k in [
            "en barres",
            "en barre",
            "bar chart",
            "barchart",
            "graphique en barre",
        ]
    ):
        found.append("bar")
    if any(k in q for k in ["line chart", "en ligne", "courbe"]) and "combo" not in q:
        found.append("line")

    return found or None


def _chart_type_of(item: dict) -> str:
    if not isinstance(item, dict):
        return ""
    if item.get("kind") == "chart" and isinstance(item.get("chart"), dict):
        return str(item["chart"].get("type") or "")
    return str(item.get("type") or "")


def _to_pie(chart: dict) -> dict:
    labels = chart.get("labels") or []
    values = chart.get("values") or []
    total = sum(float(v or 0) for v in values) or 1.0
    shares = [round(float(v or 0) / total * 100, 1) for v in values]
    return {
        "type": "pie",
        "title": chart.get("title") or "Répartition",
        "labels": labels,
        "values": [float(v or 0) for v in values],
        "shares": shares,
        "show_percent": True,
    }


def filter_visuals_by_type(
    bubbles: list[dict] | None,
    charts: list[dict] | None,
    types: list[str] | None,
) -> tuple[list[dict], list[dict]]:
    bubbles = list(bubbles or [])
    charts = list(charts or [])
    if not types:
        return bubbles, charts

    wanted = set(types)
    filtered_bubbles = [b for b in bubbles if _chart_type_of(b) in wanted]
    filtered_charts = [c for c in charts if _chart_type_of(c) in wanted]

    if "pie" in wanted and not filtered_bubbles and not filtered_charts:
        source = next(
            (b.get("chart") for b in bubbles if b.get("chart", {}).get("labels")),
            None,
        ) or next((c for c in charts if c.get("labels")), None)
        if source:
            pie = _to_pie(source)
            filtered_bubbles = [
                {
                    "id": "pie_only",
                    "label": pie["title"],
                    "kind": "chart",
                    "chart": pie,
                }
            ]
            filtered_charts = [pie]

    return filtered_bubbles, filtered_charts


def is_kpi_charts_request(question: str) -> bool:
    q = question.lower().strip()
    keywords = [
        "tous les kpi",
        "all kpi",
        "kpi en chart",
        "kpi en graphique",
        "kpi chart",
        "kpi graph",
        "graphiques kpi",
        "charts kpi",
        "pie chart",
        "en pie",
        "un pie",
        "du pie",
        "le pie",
        "histogram",
        "histogramme",
        "combo chart",
        "graphique combo",
        "uniquement des graphiques",
        "only charts",
        "visualiser les kpi",
        "visualize kpi",
        "kpi visuel",
        "en camembert",
        "en barres",
        "camembert",
        "sous forme",
    ]
    return any(k in q for k in keywords) or bool(detect_requested_chart_types(question))
