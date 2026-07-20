const texts = {
  fr: {
    newAnalysis: "Nouvelle analyse",
    history: "Historique",
    database: "Base de données",
    settings: "Paramètres",
    user: "Utilisateur",
  },
  en: {
    newAnalysis: "New analysis",
    history: "History",
    database: "Database",
    settings: "Settings",
    user: "User",
  },
};

function Sidebar({ page, onNavigate, lang }) {
  const t = texts[lang];

  const links = [
    { id: "home", label: `+ ${t.newAnalysis}` },
    { id: "history", label: t.history },
    { id: "database", label: t.database },
    { id: "settings", label: t.settings },
  ];

  const activeId = page === "result" ? "home" : page;

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-logo"
          onClick={() => onNavigate("home")}
        >
          CAP AI
        </button>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={activeId === link.id ? "active" : ""}
              onClick={() => onNavigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-db">
          <span className="db-dot" />
          PostgreSQL
        </div>
        <div className="sidebar-user">{t.user}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
