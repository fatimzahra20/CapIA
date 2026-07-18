import { useState } from "react";

const texts = {
  fr: {
    tagline: "Analyse de données conversationnelle",
    title: "Vos données répondent à vos questions",
    subtitle:
      "Posez une question en français ou en anglais. CAP AI comprend votre demande, interroge votre base de données et vous présente les KPI avec une interprétation claire.",
    cta: "Commencer l'analyse",
    featuresTitle: "Comment ça marche ?",
    features: [
      {
        title: "1. Posez votre question",
        description:
          "Écrivez simplement « Affiche les ventes par région », sans SQL ni outil technique.",
      },
      {
        title: "2. L'IA analyse",
        description:
          "Mistral comprend la demande et interroge la base de données en toute sécurité.",
      },
      {
        title: "3. Résultats clairs",
        description:
          "KPI, chiffres clés et interprétation en langage naturel, dans votre langue.",
      },
    ],
    examplesTitle: "Exemples de questions",
    examples: [
      "Affiche les ventes par région",
      "Quel est le produit le plus vendu ?",
      "Show sales by category",
    ],
  },
  en: {
    tagline: "Conversational data analytics",
    title: "Your data answers your questions",
    subtitle:
      "Ask a question in French or English. CAP AI understands your request, queries your database and presents KPIs with a clear interpretation.",
    cta: "Start analyzing",
    featuresTitle: "How does it work?",
    features: [
      {
        title: "1. Ask your question",
        description:
          "Simply write \"Show sales by region\", no SQL or technical tools needed.",
      },
      {
        title: "2. AI analyzes",
        description:
          "Mistral understands the request and safely queries the database.",
      },
      {
        title: "3. Clear results",
        description:
          "KPIs, key figures and a natural-language interpretation, in your language.",
      },
    ],
    examplesTitle: "Example questions",
    examples: [
      "Show sales by region",
      "What is the best-selling product?",
      "Affiche les ventes par catégorie",
    ],
  },
};

function HomePage({ onStart }) {
  const [lang, setLang] = useState("fr");
  const t = texts[lang];

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-logo">CAP AI</span>
        <div className="lang-switch">
          <button
            type="button"
            className={lang === "fr" ? "active" : ""}
            onClick={() => setLang("fr")}
          >
            FR
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>
      </header>

      <section className="home-hero">
        <p className="home-tagline">{t.tagline}</p>
        <h1>{t.title}</h1>
        <p className="home-subtitle">{t.subtitle}</p>
        <button type="button" className="home-cta" onClick={onStart}>
          {t.cta}
        </button>
      </section>

      <section className="home-features">
        <h2>{t.featuresTitle}</h2>
        <div className="home-features-grid">
          {t.features.map((feature) => (
            <article key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-examples">
        <h2>{t.examplesTitle}</h2>
        <ul>
          {t.examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default HomePage;
