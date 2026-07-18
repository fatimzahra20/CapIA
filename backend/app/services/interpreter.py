import json
from decimal import Decimal

from app.services.messages import detect_language
from app.services.ollama import ask_mistral


def to_jsonable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: to_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_jsonable(item) for item in value]
    return value


def compute_kpis(data: list[dict]) -> dict:
    data = to_jsonable(data)

    if not data:
        return {
            "row_count": 0,
            "total_amount": 0,
            "total_quantity": 0,
            "top_item": None,
        }

    total_amount = 0
    total_quantity = 0
    top_item = None
    top_value = None

    for row in data:
        amount = row.get("total_amount") or row.get("total_sales") or row.get("total_ventes")
        quantity = row.get("total_quantity") or row.get("quantity")

        if isinstance(amount, (int, float)):
            total_amount += amount
            label = (
                row.get("name")
                or row.get("region")
                or row.get("category")
                or row.get("product")
            )
            if top_value is None or amount > top_value:
                top_value = amount
                top_item = {"label": label, "value": amount}

        if isinstance(quantity, (int, float)):
            total_quantity += quantity

    return {
        "row_count": len(data),
        "total_amount": total_amount,
        "total_quantity": total_quantity,
        "top_item": top_item,
    }


def interpret_results(question: str, data: list[dict], kpis: dict) -> str:
    lang = detect_language(question)
    safe_data = to_jsonable(data)
    safe_kpis = to_jsonable(kpis)

    if lang == "en":
        prompt = f"""
You are a business analytics assistant.
Write a short interpretation (2-3 sentences) of these results.
Mention the main KPI insights clearly.
Do not invent numbers that are not in the data.

Question: {question}
KPIs: {json.dumps(safe_kpis, ensure_ascii=False)}
Data: {json.dumps(safe_data, ensure_ascii=False)}
Interpretation:
""".strip()
    else:
        prompt = f"""
Tu es un assistant d'analyse métier.
Rédige une courte interprétation (2-3 phrases) de ces résultats.
Mentionne clairement les principaux KPI.
N'invente aucun chiffre qui n'est pas dans les données.

Question : {question}
KPI : {json.dumps(safe_kpis, ensure_ascii=False)}
Données : {json.dumps(safe_data, ensure_ascii=False)}
Interprétation :
""".strip()

    return ask_mistral(prompt)