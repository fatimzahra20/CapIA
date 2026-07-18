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


def detect_language(text: str) -> str:
    text_lower = text.lower()
    french_markers = [
        "affiche", "montre", "quelles", "quel", "donne", "ventes",
        "région", "region", "par", "durant", "premier", "trimestre",
    ]
    english_markers = [
        "show", "display", "what", "give", "sales", "region",
        "by", "during", "first", "quarter",
    ]

    fr_score = sum(1 for word in french_markers if word in text_lower)
    en_score = sum(1 for word in english_markers if word in text_lower)

    return "fr" if fr_score >= en_score else "en"


def msg(key: str, lang: str = "fr") -> str:
    entry = MESSAGES.get(key, {})
    return entry.get(lang) or entry.get("fr") or key


def bilingual(key: str) -> dict:
    return {
        "fr": msg(key, "fr"),
        "en": msg(key, "en"),
    }