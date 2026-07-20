import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api";

const texts = {
  fr: {
    title: "Historique",
    empty: "Aucune analyse pour le moment.",
    loading: "Chargement…",
    error: "Impossible de charger l'historique.",
  },
  en: {
    title: "History",
    empty: "No analysis yet.",
    loading: "Loading…",
    error: "Unable to load history.",
  },
};

function HistoryPage({ lang }) {
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
    <main className="page-plain">
      <h1>{t.title}</h1>
      {loading && <p className="muted">{t.loading}</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="muted">{t.empty}</p>
      )}
      <ul className="history-plain">
        {history.map((item) => (
          <li key={item.id}>
            <strong>{item.question}</strong>
            <span>{item.interpretation}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default HistoryPage;
