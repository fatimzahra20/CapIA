import httpx

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral:7b"


def ask_mistral(prompt: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    return data.get("response", "").strip()