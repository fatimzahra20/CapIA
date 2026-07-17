from app.services.ollama import ask_mistral

SCHEMA_DESCRIPTION = """
Tables disponibles :
- regions(id, name)
- products(id, name, category, unit_price)
- sales(id, sale_date, region_id, product_id, quantity, total_amount)
- analysis_history(id, question, generated_sql, chart_type, interpretation, created_at)

Relations :
- sales.region_id -> regions.id
- sales.product_id -> products.id
"""


def build_sql_prompt(question: str) -> str:
    return f"""
Tu es un assistant SQL pour PostgreSQL.
À partir de la question utilisateur, génère UNIQUEMENT une requête SQL SELECT valide.
N'explique rien. Ne mets pas de markdown. Ne mets pas de ```sql.
Utilise uniquement ces tables :

{SCHEMA_DESCRIPTION}

Question : {question}
SQL :
""".strip()


def generate_sql(question: str) -> str:
    prompt = build_sql_prompt(question)
    sql = ask_mistral(prompt)
    sql = sql.strip()

    if sql.startswith("```"):
        sql = sql.replace("```sql", "").replace("```", "").strip()

    return sql