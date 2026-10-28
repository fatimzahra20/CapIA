"""Question suggestions for database and file analysis."""

from __future__ import annotations

import random
from typing import Any


PROMPT_POOL_FR = [
    "Chiffre d'affaires du mois",
    "Ventes par région",
    "Donne-moi le KPI en pie chart",
    "Plus d'interprétation",
    "Montre tous les KPI en graphiques",
    "Évolution des ventes par mois",
    "Profit par région",
    "Coût total versus ventes",
    "Meilleure région",
    "Quelle région a le moins de profit ?",
    "Montre le KPI en histogramme",
    "Montre un combo chart",
    "Quel est le chiffre d'affaires total ?",
    "Répartition des ventes North / South / East / West",
]

PROMPT_POOL_EN = [
    "Monthly revenue",
    "Sales by region",
    "Show the KPI as a pie chart",
    "More interpretation",
    "Show all KPIs as charts",
    "Monthly sales trend",
    "Profit by region",
    "Total cost versus sales",
    "Best performing region",
    "Which region has the lowest profit?",
    "Show the KPI as a histogram",
    "Show a combo chart",
    "What is total revenue?",
]

DEFAULT_DB_FR = PROMPT_POOL_FR[:6]
DEFAULT_DB_EN = PROMPT_POOL_EN[:6]


def generate_db_suggestions(lang: str = "fr", count: int = 5) -> list[str]:
    pool = PROMPT_POOL_EN if lang == "en" else PROMPT_POOL_FR
    count = max(1, min(count, len(pool)))
    return random.sample(pool, count)


def shuffle_prompts(items: list[str], lang: str = "fr", count: int = 5) -> list[str]:
    pool = list(items) if items else (PROMPT_POOL_EN if lang == "en" else PROMPT_POOL_FR)
    seen: set[str] = set()
    unique: list[str] = []
    for item in pool:
        if item and item not in seen:
            seen.add(item)
            unique.append(item)
    extra = PROMPT_POOL_EN if lang == "en" else PROMPT_POOL_FR
    for item in extra:
        if item not in seen:
            unique.append(item)
            seen.add(item)
    count = max(1, min(count, len(unique)))
    return random.sample(unique, count)


def generate_followup_suggestions(
    question: str,
    *,
    source: str = "database",
    lang: str = "fr",
    profile: dict[str, Any] | None = None,
) -> list[str]:
    """Contextual follow-up questions after an analysis."""
    q = question.lower().strip()
    pool: list[str] = []

    if source == "file" and profile:
        from app.services.file_suggestions import generate_file_suggestions

        pool.extend(generate_file_suggestions(profile, lang))
    elif lang == "en":
        if any(w in q for w in ["region", "area", "territory"]):
            pool.extend(
                [
                    "Best performing region",
                    "Show all KPIs as charts",
                    "Monthly revenue",
                    "Top selling product",
                ]
            )
        elif any(w in q for w in ["product", "item", "sku"]):
            pool.extend(
                [
                    "Sales by region",
                    "Monthly sales trend",
                    "Show all KPIs as charts",
                    "Monthly revenue",
                ]
            )
        elif any(w in q for w in ["revenue", "sales", "amount", "kpi", "chart"]):
            pool.extend(
                [
                    "Sales by region",
                    "Best selling product",
                    "Top 5 regions",
                    "Monthly sales trend",
                ]
            )
        elif any(w in q for w in ["month", "monthly", "trend", "evolution"]):
            pool.extend(
                [
                    "Monthly revenue",
                    "Sales by region",
                    "Show all KPIs as charts",
                    "Best selling product",
                ]
            )
        elif any(w in q for w in ["dashboard", "file", "summarize"]):
            pool.extend(
                [
                    "Show all KPIs as charts",
                    "Sales by region",
                    "Monthly revenue",
                ]
            )
        else:
            pool.extend(generate_db_suggestions("en"))
    else:
        if any(w in q for w in ["région", "region", "ville", "zone"]):
            pool.extend(
                [
                    "Meilleure région",
                    "Montre tous les KPI en graphiques",
                    "Chiffre d'affaires du mois",
                    "Produit le plus vendu",
                ]
            )
        elif any(w in q for w in ["produit", "product", "article"]):
            pool.extend(
                [
                    "Ventes par région",
                    "Évolution des ventes par mois",
                    "Montre tous les KPI en graphiques",
                    "Chiffre d'affaires du mois",
                ]
            )
        elif any(
            w in q
            for w in [
                "chiffre",
                "affaires",
                "ca ",
                "revenue",
                "kpi",
                "graphique",
                "chart",
            ]
        ):
            pool.extend(
                [
                    "Ventes par région",
                    "Produit le plus vendu",
                    "Top 5 des régions",
                    "Évolution des ventes par mois",
                ]
            )
        elif any(w in q for w in ["mois", "mensuel", "évolution", "evolution"]):
            pool.extend(
                [
                    "Chiffre d'affaires du mois",
                    "Ventes par région",
                    "Montre tous les KPI en graphiques",
                    "Produit le plus vendu",
                ]
            )
        elif any(w in q for w in ["dashboard", "fichier", "résume", "resume"]):
            pool.extend(
                [
                    "Montre tous les KPI en graphiques",
                    "Ventes par région",
                    "Chiffre d'affaires du mois",
                ]
            )
        else:
            pool.extend(generate_db_suggestions("fr"))

    if lang == "en":
        pool.append("More interpretation")
    else:
        pool.append("Plus d'interprétation")

    # Exclude the question just asked
    seen: set[str] = set()
    unique: list[str] = []
    q_norm = q.strip()
    for item in pool:
        if item.lower().strip() == q_norm:
            continue
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique[:6]
