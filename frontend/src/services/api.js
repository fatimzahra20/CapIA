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
  let response;
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Impossible de joindre le serveur. Vérifiez que le backend est lancé (port 8000)."
    );
  }
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

export async function fetchSuggestions(lang = "fr") {
  const response = await fetch(`${API_URL}/ai/suggestions?lang=${lang}`, {
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse(response);
}

export async function expandInterpretation(question, kpis = {}, data = [], language = "fr") {
  const response = await fetch(`${API_URL}/ai/interpret`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ question, kpis, data, language }),
  });
  return parseResponse(response);
}

export async function fetchSsoConfig() {
  const response = await fetch(`${API_URL}/auth/sso`);
  return parseResponse(response);
}

export async function pingidDemoLogin(email, fullName) {
  const response = await fetch(`${API_URL}/auth/pingid/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, full_name: fullName || undefined }),
  });
  return parseResponse(response);
}

export async function analyzeQuestion(question, language = "fr") {
  const response = await fetch(`${API_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ question, language }),
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

export async function uploadAnalysisFile(file) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/files/upload`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body,
  });
  return parseResponse(response);
}

export async function cleanAnalysisFile(fileId) {
  const response = await fetch(`${API_URL}/files/${fileId}/clean`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
  });
  return parseResponse(response);
}

export async function analyzeUploadedFile(fileId, language = "fr") {
  const response = await fetch(
    `${API_URL}/files/${fileId}/analyze?language=${encodeURIComponent(language)}`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
    }
  );
  return parseResponse(response);
}

export async function askUploadedFile(fileId, question, language = "fr") {
  const response = await fetch(`${API_URL}/files/${fileId}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ question, language }),
  });
  return parseResponse(response);
}

export function exportCleanDatasetUrl(fileId) {
  return `${API_URL}/files/${fileId}/export`;
}

export async function downloadCleanDataset(fileId, filename = "dataset_clean.csv") {
  const response = await fetch(`${API_URL}/files/${fileId}/export`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = data?.detail;
    const message =
      typeof detail === "object"
        ? detail.fr || detail.en || "Erreur export"
        : detail || "Erreur export";
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
