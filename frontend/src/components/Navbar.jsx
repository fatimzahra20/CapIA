const texts = {
  fr: {
    home: "Accueil",
    analysis: "Analyser",
    dashboard: "Dashboard",
    cta: "Commencer",
  },
  en: {
    home: "Home",
    analysis: "Analyze",
    dashboard: "Dashboard",
    cta: "Get started",
  },
};

function Navbar({ page, onNavigate, lang, onLangChange }) {
  const t = texts[lang];

  const links = [
    { id: "home", label: t.home },
    { id: "analysis", label: t.analysis },
    { id: "dashboard", label: t.dashboard },
  ];

  return (
    <nav className="navbar">
      <button
        type="button"
        className="navbar-logo"
        onClick={() => onNavigate("home")}
      >
        <span className="navbar-logo-mark">◈</span> CAP AI
      </button>

      <div className="navbar-links">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={page === link.id ? "active" : ""}
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="navbar-actions">
        <div className="navbar-lang">
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
        <button
          type="button"
          className="navbar-cta"
          onClick={() => onNavigate("analysis")}
        >
          {t.cta}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
