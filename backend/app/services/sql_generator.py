from app.services.messages import detect_language
from app.services.ollama import ask_mistral

SCHEMA_DESCRIPTION = """
Available tables / Tables disponibles :
- regions(id, name)
- products(id, name, category, unit_price)
- sales(id, sale_date, region_id, product_id, quantity, total_amount)
- analysis_history(id, question, generated_sql, chart_type, interpretation, created_at)

Relations :
- sales.region_id -> regions.id
- sales.product_id -> products.id
"""


def build_sql_prompt(question: str) -> str:
    lang = detect_language(question)

    if lang == "en":
        instructions = """
You are a PostgreSQL SQL assistant.
Generate ONLY one valid SELECT query.
Rules:
- Do not explain.
- Do not use markdown or ```sql.
- Use only the tables below.
- Always select readable names (regions.name or products.name AS name), never only IDs.
- If you create an alias with AS, use EXACTLY the same alias in ORDER BY and HAVING.
- Prefer SUM(sales.total_amount) AS total_sales for revenue.
- Prefer SUM(sales.quantity) AS total_quantity for quantity.
- Keep aliases simple: name, total_sales, total_quantity.
"""
    else:
        instructions = """
Tu es un assistant SQL pour PostgreSQL.
Génère UNIQUEMENT une requête SELECT valide.
Règles :
- N'explique rien.
- Pas de markdown ni de ```sql.
- Utilise uniquement les tables ci-dessous.
- Sélectionne toujours des noms lisibles (regions.name ou products.name AS name), jamais seulement des ID.
- Si tu crées un alias avec AS, réutilise EXACTEMENT le même alias dans ORDER BY et HAVING.
- Préfère SUM(sales.total_amount) AS total_sales pour le chiffre d'affaires.
- Préfère SUM(sales.quantity) AS total_quantity pour la quantité.
- Garde des alias simples : name, total_sales, total_quantity.
"""

    return f"""
{instructions.strip()}

{SCHEMA_DESCRIPTION}

Question: {question}
SQL:
""".strip()


def clean_sql(sql: str) -> str:
    sql = sql.strip()

    if sql.startswith("```"):
        sql = sql.replace("```sql", "").replace("```", "").strip()

    if ";" in sql:
        sql = sql.split(";")[0].strip()

    return sql


def generate_sql(question: str) -> str:
    prompt = build_sql_prompt(question)
    sql = ask_mistral(prompt)
    return clean_sql(sql)
