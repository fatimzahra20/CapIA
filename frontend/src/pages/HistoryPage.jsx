import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api";

const texts = {
  fr: {
    title: "Historique commercial",
    subtitle: "Retrouvez vos analyses de ventes précédentes.",
    loading: "Chargement de l'historique…",
    empty: "Aucune analyse enregistrée pour le moment.",
    error: "Impossible de charger l'historique.",
    analyzeCta: "Lancer une nouvelle analyse",
  },
  en: {
    title: "Sales history",
    subtitle: "Review your previous sales analyses.",
    loading: "Loading history…",
    empty: "No analysis saved yet.",
    error: "Unable to load history.",
    analyzeCta: "Start a new analysis",
  },
};

function HistoryPage({ lang, onAnalyze }) {
  const t = texts[lang];
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchHistory()
      .then((data) => {
        if (active) {
          setHistory(data.history || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(t.error);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t.error]);

  return (
    <main className="content-page">
      <header className="analysis-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      {loading && <p className="dashboard-status">{t.loading}</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && history.length === 0 && (
        <div className="empty-state">
          <p>{t.empty}</p>
          <button type="button" className="btn-primary" onClick={onAnalyze}>
            {t.analyzeCta}
          </button>
        </div>
      )}

      {!loading && history.length > 0 && (
        <ul className="history-list">
          {history.map((item) => (
            <li key={item.id}>
              <strong>{item.question}</strong>
              <span>{item.interpretation}</span>
              {item.created_at && (
                <em className="history-date">
                  {new Date(item.created_at).toLocaleString(
                    lang === "fr" ? "fr-FR" : "en-US",
                  )}
                </em>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default HistoryPage;
