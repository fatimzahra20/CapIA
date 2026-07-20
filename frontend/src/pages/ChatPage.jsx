import { useEffect, useRef, useState } from "react";
import { analyzeQuestion } from "../services/api";
import ResultsChart from "../components/ResultsChart";

const texts = {
  fr: {
    emptyTitle: "Toujours prêt à répondre.",
    placeholder: "Poser une question",
    thinking: "Analyse en cours…",
    newChat: "Nouveau chat",
    dashboard: "Tableau de bord",
    revenue: "CA",
    quantity: "Unités",
    top: "Top",
  },
  en: {
    emptyTitle: "Always ready to answer.",
    placeholder: "Ask a question",
    thinking: "Analyzing…",
    newChat: "New chat",
    dashboard: "Dashboard",
    revenue: "Revenue",
    quantity: "Units",
    top: "Top",
  },
};

function formatAmount(value) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toLocaleString("fr-FR")} DH`;
}

function ChatPage({ lang, onLangChange, onDashboard }) {
  const t = texts[lang];
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendQuestion(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const data = await analyzeQuestion(trimmed);
      if (data.language === "fr" || data.language === "en") {
        onLangChange(data.language);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.interpretation,
          kpis: data.kpis,
          chartData: data.data,
          language: data.language,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.message, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(question);
  }

  function handleNewChat() {
    setMessages([]);
    setQuestion("");
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="chat-layout">
      <header className="chat-topbar">
        <div className="chat-brand">CAP AI</div>
        <div className="chat-top-actions">
          <button type="button" onClick={handleNewChat}>
            {t.newChat}
          </button>
          <button type="button" onClick={onDashboard}>
            {t.dashboard}
          </button>
          <div className="chat-lang">
            <button
              type="button"
              className={lang === "fr" ? "active" : ""}
              onClick={() => onLangChange("fr")}
            >
              FR
            </button>
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => onLangChange("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="chat-main">
        {isEmpty ? (
          <div className="chat-empty">
            <h1>{t.emptyTitle}</h1>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-row ${message.role}`}
              >
                <div
                  className={`chat-bubble ${message.isError ? "error" : ""}`}
                >
                  <p>{message.content}</p>

                  {message.role === "assistant" && message.kpis && (
                    <div className="chat-kpis">
                      {message.kpis.total_amount != null && (
                        <span>
                          {t.revenue}: {formatAmount(message.kpis.total_amount)}
                        </span>
                      )}
                      {message.kpis.total_quantity != null && (
                        <span>
                          {t.quantity}: {message.kpis.total_quantity}
                        </span>
                      )}
                      {message.kpis.top_item?.label && (
                        <span>
                          {t.top}: {message.kpis.top_item.label}
                        </span>
                      )}
                    </div>
                  )}

                  {message.role === "assistant" &&
                    message.chartData?.length > 0 && (
                      <div className="chat-chart">
                        <ResultsChart
                          data={message.chartData}
                          language={message.language || lang}
                        />
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-row assistant">
                <div className="chat-bubble thinking">{t.thinking}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <div className="chat-input-wrap">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.placeholder}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendQuestion(question);
              }
            }}
          />
          <button type="submit" disabled={loading || !question.trim()}>
            ↑
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPage;
