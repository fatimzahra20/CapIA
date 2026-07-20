import { clearSession, getToken } from "./auth";

const API_URL = "http://127.0.0.1:8000";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
  }

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

function authHeaders() {
  const token = getToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse(response);
}

export async function fetchMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse(response);
}

export async function analyzeQuestion(question) {
  const response = await fetch(`${API_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ question }),
  });
  return parseResponse(response);
}

export async function fetchHistory() {
  const response = await fetch(`${API_URL}/ai/history`, {
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse(response);
}

export async function fetchAnalysis(id) {
  const response = await fetch(`${API_URL}/ai/history/${id}`, {
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse(response);
}

export async function fetchDbHealth() {
  const response = await fetch(`${API_URL}/health/db`);
  return parseResponse(response);
}
