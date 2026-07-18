import json
from datetime import date, datetime
from decimal import Decimal

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
            "top_item": None,
        }

    amount_keys = [
        "total_amount",
        "total_sales",
        "total_ventes",
        "revenue",
        "chiffre_affaires",
    ]

    quantity_keys = [
        "total_quantity",
        "quantity",
        "qty",
        "total_sold",
        "total_sales_per_region",
    ]

    total_amount = 0
    total_quantity = 0
    has_amount = False
    has_quantity = False
    top_item = None
    top_value = None
    top_metric = None

    for row in safe_data:
        amount = extract_numeric(row, amount_keys)
        quantity = extract_numeric(row, quantity_keys)

        if amount is not None:
            total_amount += amount
            has_amount = True

        if quantity is not None:
            total_quantity += quantity
            has_quantity = True

        metric_value = amount if amount is not None else quantity
        metric_name = "amount" if amount is not None else "quantity"

        if metric_value is not None:
            if top_value is None or metric_value > top_value:
                top_value = metric_value
                top_metric = metric_name
                top_item = {
                    "label": extract_label(row),
                    "value": metric_value,
                    "metric": metric_name,
                }

    return {
        "row_count": len(safe_data),
        "total_amount": total_amount if has_amount else None,
        "total_quantity": total_quantity if has_quantity else None,
        "top_item": top_item,
        "top_metric": top_metric,
    }


def interpret_results(
    question: str,
    data: list[dict],
    kpis: dict,
) -> str:
    lang = detect_language(question)
    safe_data = to_jsonable(data)
    safe_kpis = to_jsonable(kpis)

    if lang == "en":
        prompt = f"""
You are a business analytics assistant.
Write a short interpretation of these results in 2 or 3 sentences.
Mention only KPIs that are available.
Do not invent numbers, currencies, percentages, or facts.
If no currency is provided, do not add a currency symbol.

Question: {question}
KPIs: {json.dumps(safe_kpis, ensure_ascii=False)}
Data: {json.dumps(safe_data, ensure_ascii=False)}
Interpretation:
""".strip()
    else:
        prompt = f"""
Tu es un assistant d'analyse métier.
Rédige une courte interprétation de ces résultats en 2 ou 3 phrases.
Mentionne uniquement les KPI disponibles.
N'invente aucun chiffre, aucune devise, aucun pourcentage ou fait.
Si aucune devise n'est fournie, n'ajoute pas de symbole monétaire.

Question : {question}
KPI : {json.dumps(safe_kpis, ensure_ascii=False)}
Données : {json.dumps(safe_data, ensure_ascii=False)}
Interprétation :
""".strip()

    return ask_mistral(prompt)