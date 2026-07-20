const texts = {
  fr: {
    title: "Paramètres",
    language: "Langue de l'interface",
  },
  en: {
    title: "Settings",
    language: "Interface language",
  },
};

function SettingsPage({ lang, onLangChange }) {
  const t = texts[lang];

  return (
    <main className="simple-page">
      <h1>{t.title}</h1>
      <div className="settings-block">
        <p>{t.language}</p>
        <div className="settings-lang">
          <button
            type="button"
            className={lang === "fr" ? "active" : ""}
            onClick={() => onLangChange("fr")}
          >
            Français
          </button>
          <button
            type="button"
            className={lang === "en" ? "active" : ""}
            onClick={() => onLangChange("en")}
          >
            English
          </button>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
