const texts = {
  fr: {
    newAnalysis: "Nouvelle analyse",
    history: "Historique",
    database: "Base de données",
    settings: "Paramètres",
  },
  en: {
    newAnalysis: "New analysis",
    history: "History",
    database: "Database",
    settings: "Settings",
  },
};

function Sidebar({ page, onNavigate, lang }) {
  const t = texts[lang];

  const links = [
    { id: "home", label: t.newAnalysis },
    { id: "history", label: t.history },
    { id: "database", label: t.database },
    { id: "settings", label: t.settings },
  ];

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar-logo"
        onClick={() => onNavigate("home")}
      >
        <span className="sidebar-logo-mark">◈</span>
        CAP AI
      </button>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={page === link.id || (page === "chat" && link.id === "home") ? "active" : ""}
            onClick={() => onNavigate(link.id === "home" ? "home" : link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
