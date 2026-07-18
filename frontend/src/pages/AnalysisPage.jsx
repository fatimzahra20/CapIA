import { useEffect, useState } from "react";
import { analyzeQuestion, fetchHistory } from "../services/api";
import ResultsChart from "../components/ResultsChart";

const texts = {
  fr: {
    title: "Analyse commerciale",
    subtitle:
      "Posez une question sur vos ventes, régions ou produits. Devise : DH.",
    placeholder: "Ex. Affiche le chiffre d'affaires par région",
    button: "Analyser",
    loading: "Analyse en cours…",
    language: "Langue détectée",
    interpretation: "Interprétation commerciale",
    rows: "Lignes",
    total: "Chiffre d'affaires (DH)",
    quantity: "Unités vendues",
    top: "Meilleur élément",
    history: "Historique des analyses",
    emptyHistory: "Aucune analyse commerciale enregistrée pour le moment.",
    suggestionsTitle: "Questions suggérées",
    suggestions: [
      "Affiche les ventes par région",
      "Quel est le produit le plus vendu ?",
      "Montre le chiffre d'affaires par catégorie",
      "Quelles sont les ventes du premier trimestre ?",
    ],
  },
  en: {
    title: "Sales analysis",
    subtitle: "Ask about your sales, regions or products. Currency: DH.",
    placeholder: "e.g. Show revenue by region",
    button: "Analyze",
    loading: "Analyzing…",
    language: "Detected language",
    interpretation: "Commercial interpretation",
    rows: "Rows",
    total: "Revenue (DH)",
    quantity: "Units sold",
    top: "Top item",
    history: "Analysis history",
    emptyHistory: "No sales analysis saved yet.",
    suggestionsTitle: "Suggested questions",
    suggestions: [
      "Show sales by region",
      "What is the best-selling product?",
      "Show revenue by category",
      "What were sales in the first quarter?",
    ],
  },
};

function formatAmount(value) {
  if (value === null || value === undefined || value === "-") {
    return "-";
  }
  return `${Number(value).toLocaleString("fr-FR")} DH`;
}

function AnalysisPage({ lang, onLangChange }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const t = texts[lang];

  async function loadHistory() {
    try {
      const data = await fetchHistory();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    let active = true;

    fetchHistory()
      .then((data) => {
        if (active) {
          setHistory(data.history || []);
        }
      })
      .catch(() => {
        if (active) {
          setHistory([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await analyzeQuestion(question);
      setResult(data);
      if (data.language === "fr" || data.language === "en") {
        onLangChange(data.language);
      }
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(suggestion) {
    setQuestion(suggestion);
  }

  return (
    <main className="analysis-page">
      <header className="analysis-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="suggestions-panel">
        <h2>{t.suggestionsTitle}</h2>
        <div className="suggestions-list">
          {t.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      <form className="analysis-form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.placeholder}
          rows={3}
          required
        />
        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? t.loading : t.button}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="analysis-results">
          <p>
            <strong>{t.language} :</strong> {result.language}
          </p>

          <div className="kpi-grid">
            <article>
              <h3>{t.rows}</h3>
              <p>{result.kpis?.row_count ?? 0}</p>
            </article>
            <article>
              <h3>{t.total}</h3>
              <p>{formatAmount(result.kpis?.total_amount)}</p>
            </article>
            <article>
              <h3>{t.quantity}</h3>
              <p>{result.kpis?.total_quantity ?? "-"}</p>
            </article>
            <article>
              <h3>{t.top}</h3>
              <p>
                {result.kpis?.top_item?.label
                  ? `${result.kpis.top_item.label} (${
                      result.kpis.top_item.metric === "amount"
                        ? formatAmount(result.kpis.top_item.value)
                        : result.kpis.top_item.value
                    })`
                  : "-"}
              </p>
            </article>
          </div>

          <ResultsChart data={result.data} language={result.language} />

          <h2>{t.interpretation}</h2>
          <p>{result.interpretation}</p>
        </section>
      )}

      <section className="history-panel">
        <h2>{t.history}</h2>
        {history.length === 0 ? (
          <p className="history-empty">{t.emptyHistory}</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.question}</strong>
                <span>{item.interpretation}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default AnalysisPage;
