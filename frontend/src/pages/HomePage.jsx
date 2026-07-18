const texts = {
  fr: {
    badge: "Analyse intelligente de données",
    titleStart: "Posez vos questions.",
    titleHighlight: "Obtenez des réponses",
    titleEnd: "claires.",
    subtitle:
      "CAP AI comprend vos données, génère des analyses, des KPI, des graphiques et des interprétations en quelques secondes. Simple, rapide et intelligent.",
    ctaPrimary: "Commencer une analyse",
    ctaSecondary: "Voir le dashboard",
    trust: "Sécurisé • Rapide • Intelligent",
    features: [
      {
        icon: "💬",
        title: "Posez en langage naturel",
        description:
          "Écrivez vos questions en français ou en anglais, comme à un expert.",
      },
      {
        icon: "📊",
        title: "Analysez instantanément",
        description:
          "CAP AI génère les requêtes, analyse les données et calcule les KPI.",
      },
      {
        icon: "🛡️",
        title: "Des résultats exploitables",
        description:
          "Visualisez vos données avec des graphiques et des interprétations claires.",
      },
    ],
    preview: {
      question: "Montre le chiffre d'affaires par région ce mois-ci",
      kpis: [
        { label: "Chiffre d'affaires", value: "12 450 DH" },
        { label: "Meilleure région", value: "Nord" },
        { label: "Ventes", value: "320" },
        { label: "Produits vendus", value: "2 150" },
      ],
    },
  },
  en: {
    badge: "Smart data analytics",
    titleStart: "Ask your questions.",
    titleHighlight: "Get clear",
    titleEnd: "answers.",
    subtitle:
      "CAP AI understands your data and generates analyses, KPIs, charts and interpretations in seconds. Simple, fast and smart.",
    ctaPrimary: "Start an analysis",
    ctaSecondary: "View dashboard",
    trust: "Secure • Fast • Smart",
    features: [
      {
        icon: "💬",
        title: "Ask in natural language",
        description:
          "Write your questions in French or English, like talking to an expert.",
      },
      {
        icon: "📊",
        title: "Analyze instantly",
        description:
          "CAP AI generates queries, analyzes data and computes KPIs.",
      },
      {
        icon: "🛡️",
        title: "Actionable results",
        description:
          "Visualize your data with clear charts and interpretations.",
      },
    ],
    preview: {
      question: "Show revenue by region this month",
      kpis: [
        { label: "Revenue", value: "12,450 DH" },
        { label: "Best region", value: "Nord" },
        { label: "Sales", value: "320" },
        { label: "Units sold", value: "2,150" },
      ],
    },
  },
};

function HomePage({ lang, onStart, onDashboard }) {
  const t = texts[lang];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-text">
          <p className="home-badge">{t.badge}</p>
          <h1>
            {t.titleStart}
            <br />
            <span className="highlight">{t.titleHighlight}</span> {t.titleEnd}
          </h1>
          <p className="home-subtitle">{t.subtitle}</p>
          <div className="home-cta-row">
            <button type="button" className="btn-primary" onClick={onStart}>
              ✦ {t.ctaPrimary}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onDashboard}
            >
              ▶ {t.ctaSecondary}
            </button>
          </div>
          <p className="home-trust">🛡 {t.trust}</p>
        </div>

        <div className="home-preview">
          <div className="home-preview-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="home-preview-question">
            <span>💬</span>
            <p>{t.preview.question}</p>
          </div>
          <div className="home-preview-kpis">
            {t.preview.kpis.map((kpi) => (
              <article key={kpi.label}>
                <h4>{kpi.label}</h4>
                <p>{kpi.value}</p>
              </article>
            ))}
          </div>
          <div className="home-preview-bars">
            {[80, 45, 30, 22].map((height, index) => (
              <div
                key={index}
                className="preview-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-features">
        {t.features.map((feature) => (
          <article key={feature.title}>
            <span className="feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default HomePage;
