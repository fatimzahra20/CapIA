const texts = {
  fr: {
    title: "À propos de CAP AI",
    subtitle: "Assistant d'analyse commerciale conversationnelle",
    missionTitle: "Notre mission",
    mission:
      "Aider les responsables commerciaux et business analysts à comprendre leurs ventes sans écrire de SQL ni configurer Power BI.",
    forWhoTitle: "Pour qui ?",
    forWho:
      "Responsables des ventes, managers régionaux et analystes métier qui ont besoin de KPI rapides, de graphiques et d'interprétations claires.",
    whatTitle: "Ce que fait CAP AI",
    items: [
      "Comprend vos questions en français ou en anglais",
      "Analyse le chiffre d'affaires, les régions et les produits",
      "Calcule les KPI commerciaux (CA en DH, top région, top produit)",
      "Affiche automatiquement le graphique adapté",
      "Propose une interprétation orientée décision",
    ],
    securityTitle: "Sécurité",
    security:
      "Les analyses sont limitées aux requêtes de lecture (SELECT). Aucune modification des données n'est autorisée via l'assistant.",
  },
  en: {
    title: "About CAP AI",
    subtitle: "Conversational sales analytics assistant",
    missionTitle: "Our mission",
    mission:
      "Help sales managers and business analysts understand sales without writing SQL or configuring Power BI.",
    forWhoTitle: "Who is it for?",
    forWho:
      "Sales leaders, regional managers and business analysts who need fast KPIs, charts and clear interpretations.",
    whatTitle: "What CAP AI does",
    items: [
      "Understands questions in French or English",
      "Analyzes revenue, regions and products",
      "Computes commercial KPIs (revenue in DH, top region, top product)",
      "Automatically chooses the right chart",
      "Provides a decision-oriented interpretation",
    ],
    securityTitle: "Security",
    security:
      "Analyses are limited to read-only SELECT queries. No data modification is allowed through the assistant.",
  },
};

function AboutPage({ lang }) {
  const t = texts[lang];

  return (
    <main className="content-page">
      <header className="analysis-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <section className="about-grid">
        <article>
          <h2>{t.missionTitle}</h2>
          <p>{t.mission}</p>
        </article>
        <article>
          <h2>{t.forWhoTitle}</h2>
          <p>{t.forWho}</p>
        </article>
        <article>
          <h2>{t.whatTitle}</h2>
          <ul>
            {t.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h2>{t.securityTitle}</h2>
          <p>{t.security}</p>
        </article>
      </section>
    </main>
  );
}

export default AboutPage;
