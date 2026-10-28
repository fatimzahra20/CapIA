from app.services.messages import detect_language
from app.services.ollama import ask_mistral

SCHEMA_DESCRIPTION = """
Base d'analyse commerciale CAP AI (jeu de données difficult_dataset) :
- regions(id, name) : North, South, East, West, International
- sales(id, sale_date, region_id, quantity, total_amount, cost, profit, description, mixed_column)
- products(id, name, category, unit_price) : optionnel
- analysis_history(...)

Relations :
- sales.region_id -> regions.id

Business meaning:
- total_amount = Sales / chiffre d'affaires
- cost = coût
- profit = marge / bénéfice
- quantity = 1 par ligne (chaque enregistrement est une transaction)
Période des données : janvier 2023 (du 1 au 15).
"""

MONTH_FILTER = """
DATE_TRUNC('month', sales.sale_date) = (
    SELECT DATE_TRUNC('month', MAX(sale_date)) FROM sales
)
"""

SQL_TEMPLATES = [
    (
        [
            "chiffre d'affaires du mois",
            "chiffre d affaires du mois",
            "ca du mois",
            "revenue this month",
            "sales this month",
            "ventes du mois",
            "du mois",
            "this month",
        ],
        f"""
SELECT regions.name AS name,
       SUM(sales.total_amount) AS total_sales,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
JOIN regions ON sales.region_id = regions.id
WHERE {MONTH_FILTER}
GROUP BY regions.name
ORDER BY total_sales DESC
""".strip(),
    ),
    (
        [
            "chiffre d'affaires total",
            "chiffre d affaires total",
            "ca total",
            "total revenue",
            "donne moi les chiffres d affaires",
            "donne moi les chiffres d'affaires",
        ],
        """
SELECT SUM(sales.total_amount) AS total_sales,
       SUM(sales.cost) AS total_cost,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
""".strip(),
    ),
    (
        [
            "ventes par région",
            "ventes par region",
            "sales by region",
            "show sales by region",
            "profit par région",
            "profit par region",
        ],
        """
SELECT regions.name AS name,
       SUM(sales.total_amount) AS total_sales,
       SUM(sales.cost) AS total_cost,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
JOIN regions ON sales.region_id = regions.id
GROUP BY regions.name
ORDER BY total_sales DESC
""".strip(),
    ),
    (
        [
            "produit le plus vendu",
            "best product",
            "top product",
            "plus vendu",
            "meilleure région",
            "meilleure region",
            "best region",
        ],
        """
SELECT regions.name AS name,
       SUM(sales.total_amount) AS total_sales,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
JOIN regions ON sales.region_id = regions.id
GROUP BY regions.name
ORDER BY total_sales DESC
""".strip(),
    ),
    (
        ["kpi", "indicateurs", "coût", "cout", "profit", "marge"],
        """
SELECT SUM(sales.total_amount) AS total_sales,
       SUM(sales.cost) AS total_cost,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
""".strip(),
    ),
]


def match_template_sql(question: str) -> str | None:
    q = (
        " ".join(question.lower().strip().split())
        .replace("'", " ")
        .replace("’", " ")
    )
    q = " ".join(q.split())
    for keywords, sql in SQL_TEMPLATES:
        normalized_keywords = [
            " ".join(k.lower().replace("'", " ").replace("’", " ").split())
            for k in keywords
        ]
        if any(keyword in q for keyword in normalized_keywords):
            return sql
    return None


def build_sql_prompt(question: str) -> str:
    lang = detect_language(question)

    if lang == "en":
        instructions = """
You are a PostgreSQL assistant for SALES analytics on the difficult_dataset.
Generate ONLY one valid SELECT query.
Rules:
- Do not explain.
- Do not use markdown or ```sql.
- Use only sales and regions (products is optional and often empty).
- Always select readable names (regions.name AS name).
- Prefer SUM(sales.total_amount) AS total_sales for revenue.
- Prefer SUM(sales.profit) AS total_profit and SUM(sales.cost) AS total_cost.
- Prefer COUNT(*) AS total_quantity for transaction count.
"""
    else:
        instructions = """
Tu es un assistant SQL PostgreSQL pour l'analyse COMMERCIALE (jeu difficult_dataset).
Génère UNIQUEMENT une requête SELECT valide.
Règles :
- N'explique rien.
- Pas de markdown ni de ```sql.
- Utilise sales et regions (products est souvent vide).
- Sélectionne toujours regions.name AS name.
- Préfère SUM(sales.total_amount) AS total_sales pour le CA.
- Préfère SUM(sales.profit) AS total_profit et SUM(sales.cost) AS total_cost.
- Préfère COUNT(*) AS total_quantity pour le nombre de transactions.
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
    templated = match_template_sql(question)
    if templated:
        return templated

    prompt = build_sql_prompt(question)
    try:
        sql = ask_mistral(prompt, timeout=25.0, num_predict=100)
        return clean_sql(sql)
    except Exception:
        return """
SELECT regions.name AS name,
       SUM(sales.total_amount) AS total_sales,
       SUM(sales.profit) AS total_profit,
       COUNT(*) AS total_quantity
FROM sales
JOIN regions ON sales.region_id = regions.id
GROUP BY regions.name
ORDER BY total_sales DESC
""".strip()
