import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api";

function History({ lang, onSelect, user }) {
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
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#102A43]">
        {lang === "en" ? "History" : "Historique"}
      </h1>
      <p className="mb-6 text-sm text-[#627D98]">
        {lang === "en"
          ? `Only your analyses (${user?.email || "PingID"}). Other users cannot see them.`
          : `Uniquement vos analyses (${user?.email || "PingID"}). Les autres utilisateurs PingID ne les voient pas.`}
      </p>
      {loading && <p className="text-[#627D98]">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && history.length === 0 && (
        <p className="text-[#627D98]">Aucune analyse pour le moment.</p>
      )}
      <ul className="mt-2 grid gap-3">
        {history.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full rounded-2xl border border-[#E3E8EF] bg-white px-4 py-3.5 text-left shadow-[0_6px_20px_rgba(16,42,67,0.04)] transition hover:border-[#0D9488]/35"
            >
              <div className="text-sm font-medium text-[#102A43]">
                {item.question}
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-[#627D98]">
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
