import { useState } from "react";

const texts = {
  fr: {
    title: "Bienvenue sur CAP AI",
    intro:
      "Analysez vos données en langage naturel grâce à l'intelligence artificielle.",
    placeholder: "Posez une question sur vos données...",
    suggestions: [
      "Chiffre d'affaires du mois",
      "Ventes par région",
      "Produit le plus vendu",
      "Show sales by region",
    ],
  },
  en: {
    title: "Welcome to CAP AI",
    intro: "Analyze your data in natural language with artificial intelligence.",
    placeholder: "Ask a question about your data...",
    suggestions: [
      "Chiffre d'affaires du mois",
      "Ventes par région",
      "Produit le plus vendu",
      "Show sales by region",
    ],
  },
};

function HomePage({ lang, onAnalyze, loading }) {
  const t = texts[lang];
  const [question, setQuestion] = useState("");

  function submit(text) {
    const value = (text ?? question).trim();
    if (!value || loading) return;
    onAnalyze(value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit();
  }

  return (
    <main className="home-center">
      <div className="home-center-inner">
        <h1>{t.title}</h1>
        <p className="home-subtitle">{t.intro}</p>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.placeholder}
            disabled={loading}
          />
          <button
            type="submit"
            className="composer-send"
            disabled={loading || !question.trim()}
            aria-label="Analyser"
          >
            ↑
          </button>
        </form>

        <div className="suggestion-chips">
          {t.suggestions.map((item) => (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => submit(item)}
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
