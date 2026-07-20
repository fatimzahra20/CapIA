import ResultsChart from "../components/ResultsChart";

const texts = {
  fr: {
    you: "Vous",
    assistant: "CAP AI",
    thinking: "Réflexion…",
    revenue: "Chiffre d'affaires",
    quantity: "Unités vendues",
    top: "Meilleur élément",
    rows: "Lignes",
    table: "Tableau",
    interpretation: "Interprétation IA",
    askAgain: "Nouvelle analyse",
  },
  en: {
    you: "You",
    assistant: "CAP AI",
    thinking: "Thinking…",
    revenue: "Revenue",
    quantity: "Units sold",
    top: "Top item",
    rows: "Rows",
    table: "Table",
    interpretation: "AI interpretation",
    askAgain: "New analysis",
  },
};

function formatAmount(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} DH`;
}

function ChatResult({ lang, loading, error, result, question, onReset }) {
  const t = texts[lang];
  const columns =
    result?.data?.length > 0 ? Object.keys(result.data[0]) : [];

  return (
    <main className="conversation">
      <div className="conversation-inner">
        <section className="msg msg-user">
          <div className="msg-role">{t.you}</div>
          <div className="msg-body">{question}</div>
        </section>

        <section className="msg msg-assistant">
          <div className="msg-role">{t.assistant}</div>

          {loading && <div className="msg-body thinking">{t.thinking}</div>}

          {error && !loading && <div className="msg-body error">{error}</div>}

          {result && !loading && (
            <div className="msg-body fade-in">
              <p className="msg-text">
                {lang === "fr"
                  ? "Voici l'analyse de vos données."
                  : "Here is the analysis of your data."}
              </p>

              <div className="kpi-row">
                <article>
                  <span>{t.rows}</span>
                  <strong>{result.kpis?.row_count ?? 0}</strong>
                </article>
                <article>
                  <span>{t.revenue}</span>
                  <strong>{formatAmount(result.kpis?.total_amount)}</strong>
                </article>
                <article>
                  <span>{t.quantity}</span>
                  <strong>{result.kpis?.total_quantity ?? "-"}</strong>
                </article>
                <article>
                  <span>{t.top}</span>
                  <strong>{result.kpis?.top_item?.label ?? "-"}</strong>
                </article>
              </div>

              {result.data?.length > 0 && (
                <div className="panel">
                  <ResultsChart
                    data={result.data}
                    language={result.language || lang}
                  />
                </div>
              )}

              {result.data?.length > 0 && (
                <div className="panel table-panel">
                  <h3>{t.table}</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.map((row, index) => (
                          <tr key={index}>
                            {columns.map((col) => (
                              <td key={col}>{String(row[col] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="panel">
                <h3>{t.interpretation}</h3>
                <p>{result.interpretation}</p>
              </div>
            </div>
          )}
        </section>

        {!loading && (
          <button type="button" className="ghost-btn" onClick={onReset}>
            {t.askAgain}
          </button>
        )}
      </div>
    </main>
  );
}

export default ChatResult;
