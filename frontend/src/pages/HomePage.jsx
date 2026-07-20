import { useState } from "react";

const texts = {
  fr: {
    title: "Bienvenue sur CAP AI",
    intro:
      "CAP AI est une plateforme d'analyse de données assistée par intelligence artificielle. Posez vos questions en langage naturel et obtenez des analyses, des KPI, des graphiques et des interprétations en quelques secondes.",
    placeholder: "Posez une question sur vos données...",
    analyze: "Analyser",
    suggestions: [
      "Chiffre d'affaires du mois",
      "Ventes par région",
      "Produit le plus vendu",
      "Show sales by region",
    ],
  },
  en: {
    title: "Welcome to CAP AI",
    intro:
      "CAP AI is an AI-assisted data analytics platform. Ask questions in natural language and get analyses, KPIs, charts and interpretations in seconds.",
    placeholder: "Ask a question about your data...",
    analyze: "Analyze",
    suggestions: [
      "Monthly revenue",
      "Sales by region",
      "Best-selling product",
      "Show sales by region",
    ],
  },
};

function HomePage({ lang, onAnalyze, loading }) {
  const t = texts[lang];
  const [question, setQuestion] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    onAnalyze(question.trim());
  }

  return (
    <main className="home-minimal">
      <div className="home-minimal-content">
        <h1>{t.title}</h1>
        <p className="home-intro">{t.intro}</p>

        <form className="home-ask-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.placeholder}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !question.trim()}>
            {loading ? "…" : t.analyze}
          </button>
        </form>

        <div className="home-suggestions">
          {t.suggestions.map((item) => (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onAnalyze(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default HomePage;
