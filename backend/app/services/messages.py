MESSAGES = {
    "empty_question": {
        "fr": "La question est vide",
        "en": "The question is empty",
    },
    "ollama_error": {
        "fr": "Erreur Ollama",
        "en": "Ollama error",
    },
    "select_only": {
        "fr": "Seules les requêtes SELECT sont autorisées",
        "en": "Only SELECT queries are allowed",
    },
    "sql_error": {
        "fr": "Erreur SQL",
        "en": "SQL error",
    },
    "backend_running": {
        "fr": "Le backend CAP AI fonctionne",
        "en": "CAP AI backend is running",
    },
}


import re

_FR_WORDS = {
    "affiche", "afficher", "montre", "montrer", "quelles", "quels", "quelle", "quel",
    "donne", "donner", "ventes", "vente", "chiffre", "affaires", "durant", "pendant",
    "trimestre", "mois", "annee", "année", "region", "région", "meilleure", "meilleur",
    "combien", "interpretation", "interprétation", "explique", "expliquer",
    "historique", "parametres", "paramètres", "produit", "produits", "cout", "coût",
    "benefice", "bénéfice", "repartition", "répartition", "camembert", "graphique",
    "evolution", "évolution", "total", "moyenne",
}
_EN_WORDS = {
    "show", "display", "what", "which", "give", "tell", "sales", "revenue", "profit",
    "cost", "during", "first", "quarter", "month", "year", "best", "top", "average",
    "how", "many", "much", "more", "interpretation", "explain", "history", "settings",
    "please", "region", "regions", "breakdown", "pie", "chart", "bar", "histogram",
    "product", "products", "trend", "total", "by", "the", "is", "are", "for", "of",
    "and", "with", "from", "each", "per",
}


def detect_language(text: str) -> str:
    raw = (text or "").strip()
    if not raw:
        return "fr"

    lower = raw.lower()

    # Accents français → FR
    if re.search(r"[àâäéèêëïîôùûüçœ]", lower):
        return "fr"

    tokens = set(re.findall(r"[a-zàâäéèêëïîôùûüçœ']+", lower))

    fr_score = len(tokens & _FR_WORDS)
    en_score = len(tokens & _EN_WORDS)

    # Amorces typiques
    if re.match(r"^(show|what|which|give|how|display|tell|please)\b", lower):
        en_score += 3
    if re.match(r"^(affiche|montre|quel|quelle|quels|quelles|donne|combien)\b", lower):
        fr_score += 3

    if en_score > fr_score:
        return "en"
    if fr_score > en_score:
        return "fr"

    # Dernier recours : présence de mots anglais très marquants
    if tokens & {"show", "what", "sales", "revenue", "profit", "which", "how"}:
        return "en"
    return "fr"


def resolve_language(text: str = "", preferred: str | None = None) -> str:
    """Prefer the UI/settings language when provided; otherwise detect from text."""
    if preferred in ("fr", "en"):
        return preferred
    if (text or "").strip():
        return detect_language(text)
    return "fr"


def msg(key: str, lang: str = "fr") -> str:
    entry = MESSAGES.get(key, {})
    return entry.get(lang) or entry.get("fr") or key


def bilingual(key: str) -> dict:
    return {
        "fr": msg(key, "fr"),
        "en": msg(key, "en"),
    }
