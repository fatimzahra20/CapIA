import { useState } from "react";
import { analyzeQuestion } from "../services/api";

const texts = {
  fr: {
    title: "CAP AI",
    subtitle: "Posez une question sur vos données en français ou en anglais.",
    placeholder: "Ex. Affiche les ventes par région",
    button: "Analyser",
    loading: "Analyse en cours…",
    home: "Accueil",
    language: "Langue détectée",
    kpis: "KPI",
    interpretation: "Interprétation",
    rows: "Lignes",
    total: "Montant total",
    quantity: "Quantité totale",
    top: "Meilleur élément",
  },
  en: {
    title: "CAP AI",
    subtitle: "Ask a question about your data in French or English.",
    placeholder: "e.g. Show sales by region",
    button: "Analyze",
    loading: "Analyzing…",
    home: "Home",
    language: "Detected language",
    kpis: "KPIs",
    interpretation: "Interpretation",
    rows: "Rows",
    total: "Total amount",
    quantity: "Total quantity",
    top: "Top item",
  },
};

function AnalysisPage({ onHome }) {
  const [uiLang, setUiLang] = useState("fr");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const t = texts[uiLang];

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await analyzeQuestion(question);
      setResult(data);
      if (data.language === "fr" || data.language === "en") {
        setUiLang(data.language);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="analysis-page">
      <header className="analysis-header">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="lang-switch">
          {onHome && (
            <button type="button" onClick={onHome}>
              {t.home}
            </button>
          )}
          <button type="button" onClick={() => setUiLang("fr")}>FR</button>
          <button type="button" onClick={() => setUiLang("en")}>EN</button>
        </div>
      </header>

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
              <p>{result.kpis?.total_amount ?? 0}</p>
            </article>
            <article>
              <h3>{t.quantity}</h3>
              <p>{result.kpis?.total_quantity ?? 0}</p>
            </article>
            <article>
              <h3>{t.top}</h3>
              <p>
                {result.kpis?.top_item
                  ? `${result.kpis.top_item.label} (${result.kpis.top_item.value})`
                  : "-"}
              </p>
            </article>
          </div>

          <h2>{t.interpretation}</h2>
          <p>{result.interpretation}</p>
        </section>
      )}
    </main>
  );
}

export default AnalysisPage;