const API_URL = "http://127.0.0.1:8000";

async function parseResponse(response) {
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

export async function analyzeQuestion(question) {
  const response = await fetch(`${API_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return parseResponse(response);
}

export async function fetchHistory() {
  const response = await fetch(`${API_URL}/ai/history`);
  return parseResponse(response);
}

export async function fetchDashboard() {
  const response = await fetch(`${API_URL}/dashboard/summary`);
  return parseResponse(response);
}
