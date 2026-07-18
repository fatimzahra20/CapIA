const API_URL = "http://127.0.0.1:8000";

export async function analyzeQuestion(question) {
  const response = await fetch(`${API_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();

  if (!response.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === "object"
        ? detail.fr || detail.en || "Erreur API"
        : detail || "Erreur API";
    throw new Error(message);
  }

  return data;
}