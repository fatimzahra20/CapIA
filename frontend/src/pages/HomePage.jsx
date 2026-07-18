const texts = {
  fr: {
    badge: "Assistant d'analyse commerciale",
    titleStart: "Analysez vos ventes",
    titleHighlight: "en langage naturel",
    titleEnd: "",
    subtitle:
      "Posez une question sur votre chiffre d'affaires, vos régions ou vos produits. CAP AI calcule les KPI, affiche le graphique et propose une interprétation commerciale.",
    ctaPrimary: "Analyser mes ventes",
    ctaSecondary: "Voir le tableau de bord",
    trust: "Orienté ventes • KPI en DH • FR / EN",
    features: [
      {
        icon: "💬",
        title: "Questions commerciales",
        description:
          "Demandez le CA par région, le top produit ou la performance du trimestre.",
      },
      {
        icon: "📈",
        title: "KPI métier",
        description:
          "Chiffre d'affaires, meilleure région, produit phare et volumes de ventes.",
      },
      {
        icon: "🧭",
        title: "Décisions plus rapides",
        description:
          "Graphiques et interprétation pour aider les responsables commerciaux.",
      },
    ],
    preview: {
      question: "Affiche le chiffre d'affaires par région",
      kpis: [
        { label: "CA total", value: "65 950 DH" },
        { label: "Meilleure région", value: "Casablanca" },
        { label: "Top produit", value: "Ordinateur" },
        { label: "Unités vendues", value: "39" },
      ],
    },
  },
  en: {
    badge: "Sales analytics assistant",
    titleStart: "Analyze your sales",
    titleHighlight: "in natural language",
    titleEnd: "",
    subtitle:
      "Ask about revenue, regions or products. CAP AI computes KPIs, shows the chart and delivers a commercial interpretation.",
    ctaPrimary: "Analyze my sales",
    ctaSecondary: "Open sales dashboard",
    trust: "Sales-focused • KPIs in DH • FR / EN",
    features: [
      {
        icon: "💬",
        title: "Commercial questions",
        description:
          "Ask for revenue by region, top products or quarterly performance.",
      },
      {
        icon: "📈",
        title: "Business KPIs",
        description:
          "Revenue, best region, top product and sales volumes.",
      },
      {
        icon: "🧭",
        title: "Faster decisions",
        description:
          "Charts and interpretation designed for sales managers.",
      },
    ],
    preview: {
      question: "Show revenue by region",
      kpis: [
        { label: "Total revenue", value: "65,950 DH" },
        { label: "Best region", value: "Casablanca" },
        { label: "Top product", value: "Laptop" },
        { label: "Units sold", value: "39" },
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
            <span className="highlight">{t.titleHighlight}</span>
            {t.titleEnd ? ` ${t.titleEnd}` : ""}
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
