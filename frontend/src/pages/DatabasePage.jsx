const texts = {
  fr: {
    title: "Base de données",
    text:
      "La connexion à une base externe sera disponible dans une prochaine version. Pour le moment, CAP AI utilise la base de démonstration PostgreSQL (ventes, produits, régions).",
  },
  en: {
    title: "Database",
    text:
      "External database connection will be available in a future version. For now, CAP AI uses the PostgreSQL demo database (sales, products, regions).",
  },
};

function DatabasePage({ lang }) {
  const t = texts[lang];
  return (
    <main className="simple-page">
      <h1>{t.title}</h1>
      <p className="muted">{t.text}</p>
    </main>
  );
}

export default DatabasePage;
