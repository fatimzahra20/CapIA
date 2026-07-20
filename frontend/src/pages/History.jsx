import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api";

function History({ lang, onSelect }) {
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
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-3 text-2xl font-semibold text-white">
        {lang === "en" ? "History" : "Historique"}
      </h1>
      {loading && <p className="text-[#A1A1AA]">Chargement…</p>}
      {error && <p className="text-red-300">{error}</p>}
      {!loading && history.length === 0 && (
        <p className="text-[#A1A1AA]">Aucune analyse pour le moment.</p>
      )}
      <ul className="mt-5 grid gap-2.5">
        {history.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full rounded-xl border border-[#333] bg-[#2A2A2A] px-4 py-3 text-left transition hover:bg-[#303030]"
            >
              <div className="text-sm font-medium text-white">{item.question}</div>
              <div className="mt-1 line-clamp-2 text-sm text-[#A1A1AA]">
                {item.interpretation}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default History;
