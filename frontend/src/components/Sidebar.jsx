import { useEffect, useState } from "react";
import {
  Database,
  History,
  LogOut,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { fetchHistory } from "../services/api";

const texts = {
  fr: {
    newAnalysis: "Nouvelle analyse",
    history: "Historique",
    database: "Base de données",
    settings: "Paramètres",
    recent: "Récentes",
    connected: "PostgreSQL connecté",
    logout: "Déconnexion",
  },
  en: {
    newAnalysis: "New analysis",
    history: "History",
    database: "Database",
    settings: "Settings",
    recent: "Recent",
    connected: "PostgreSQL connected",
    logout: "Log out",
  },
};

function Sidebar({
  page,
  selectedId,
  onNavigate,
  onSelectAnalysis,
  onLogout,
  user,
  lang,
  refreshKey,
}) {
  const t = texts[lang];
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let active = true;
    fetchHistory()
      .then((data) => {
        if (active) setRecent((data.history || []).slice(0, 8));
      })
      .catch(() => {
        if (active) setRecent([]);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const navItems = [
    { id: "home", label: t.newAnalysis, icon: Plus },
    { id: "history", label: t.history, icon: History },
    { id: "database", label: t.database, icon: Database },
    { id: "settings", label: t.settings, icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[260px] flex-col border-r border-[#222] bg-[#171717]">
      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px] font-semibold text-[#ececec]"
        >
          <Sparkles size={16} className="text-[#2563EB]" />
          CAP AI
        </button>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-[#2A2A2A] text-white"
                    : "text-[#ECECEC] hover:bg-[#212121]"
                }`}
              >
                <Icon size={16} />
                {item.id === "home" ? `+ ${item.label}` : item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-[#A1A1AA]">
          {t.recent}
        </p>
        <div className="flex flex-col gap-0.5">
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAnalysis(item.id)}
              className={`truncate rounded-[10px] px-3 py-2 text-left text-sm transition ${
                selectedId === item.id
                  ? "bg-[#2A2A2A] text-white"
                  : "text-[#A1A1AA] hover:bg-[#212121] hover:text-[#ECECEC]"
              }`}
              title={item.question}
            >
              {item.question}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#222] px-4 py-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {t.connected}
        </div>
        <div className="mb-1 text-sm font-medium text-[#ECECEC]">
          {user?.full_name || "Utilisateur"}
        </div>
        <div className="mb-3 truncate text-xs text-[#A1A1AA]">
          {user?.email}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-[#A1A1AA] transition hover:text-white"
        >
          <LogOut size={14} />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
