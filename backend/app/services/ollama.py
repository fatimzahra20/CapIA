import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"
MODEL_NAME = "mistral:7b"
DEFAULT_TIMEOUT = 45.0

_ollama_ok_cache: dict[str, float | bool] = {"ok": False, "checked_at": 0.0}


def ollama_available(timeout: float = 0.8) -> bool:
    import time

    now = time.time()
    # Cache availability for 20s to avoid an extra HTTP roundtrip every call
    if now - float(_ollama_ok_cache["checked_at"]) < 20:
        return bool(_ollama_ok_cache["ok"])

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(OLLAMA_TAGS_URL)
            ok = response.status_code == 200
    except Exception:
        ok = False

    _ollama_ok_cache["ok"] = ok
    _ollama_ok_cache["checked_at"] = now
    return ok


def ask_mistral(
    prompt: str,
    timeout: float = DEFAULT_TIMEOUT,
    num_predict: int = 180,
) -> str:
    if not ollama_available():
        raise RuntimeError("Ollama n'est pas démarré (http://localhost:11434)")

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": num_predict,
            "temperature": 0.1,
        },
    }

    with httpx.Client(timeout=timeout) as client:
        response = client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    return data.get("response", "").strip()
