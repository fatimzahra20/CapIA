const texts = {
  fr: {
    title: "Base de données",
    text:
      "CAP AI est connecté à PostgreSQL (base de démonstration ventes / produits / régions). La connexion à une base externe arrivera plus tard.",
  },
  en: {
    title: "Database",
    text:
      "CAP AI is connected to PostgreSQL (sales / products / regions demo). External database connection will come later.",
  },
};

function DatabasePage({ lang }) {
  const t = texts[lang];
  return (
    <main className="page-plain">
      <h1>{t.title}</h1>
      <p className="muted">{t.text}</p>
    </main>
  );
}

export default DatabasePage;
