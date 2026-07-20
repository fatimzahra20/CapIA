const texts = {
  fr: {
    title: "Paramètres",
    language: "Langue",
  },
  en: {
    title: "Settings",
    language: "Language",
  },
};

function SettingsPage({ lang, onLangChange }) {
  const t = texts[lang];

  return (
    <main className="page-plain">
      <h1>{t.title}</h1>
      <p className="muted">{t.language}</p>
      <div className="lang-switch">
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
    </main>
  );
}

export default SettingsPage;
