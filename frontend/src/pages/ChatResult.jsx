import ResultsChart from "../components/ResultsChart";

const texts = {
  fr: {
    thinking: "Analyse en cours…",
    askAgain: "Poser une autre question",
    revenue: "Chiffre d'affaires",
    quantity: "Unités vendues",
    top: "Meilleur élément",
    rows: "Lignes",
    interpretation: "Interprétation",
  },
  en: {
    thinking: "Analyzing…",
    askAgain: "Ask another question",
    revenue: "Revenue",
    quantity: "Units sold",
    top: "Top item",
    rows: "Rows",
    interpretation: "Interpretation",
  },
};

function formatAmount(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} DH`;
}

function ChatResult({ lang, loading, error, result, question, onReset }) {
  const t = texts[lang];

  return (
    <main className="result-page">
      <div className="result-inner">
        <div className="result-question">
          <span className="result-label">Q</span>
          <p>{question}</p>
        </div>

        {loading && <p className="result-thinking">{t.thinking}</p>}

        {error && <p className="result-error">{error}</p>}

        {result && !loading && (
          <div className="result-answer">
            <div className="result-kpis">
              <article>
                <h3>{t.rows}</h3>
                <p>{result.kpis?.row_count ?? 0}</p>
              </article>
              <article>
                <h3>{t.revenue}</h3>
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
                    ? `${result.kpis.top_item.label}`
                    : "-"}
                </p>
              </article>
            </div>

            {result.data?.length > 0 && (
              <div className="result-chart">
                <ResultsChart data={result.data} language={result.language || lang} />
              </div>
            )}

            <section className="result-interpretation">
              <h2>{t.interpretation}</h2>
              <p>{result.interpretation}</p>
            </section>
          </div>
        )}

        <button type="button" className="result-reset" onClick={onReset}>
          {t.askAgain}
        </button>
      </div>
    </main>
  );
}

export default ChatResult;
