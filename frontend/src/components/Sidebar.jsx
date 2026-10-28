import { useEffect, useState } from "react";
import { History, LogOut, Plus, Settings, BarChart3 } from "lucide-react";
import { fetchHistory } from "../services/api";

const texts = {
  fr: {
    newAnalysis: "Nouvelle analyse",
    history: "Historique",
    settings: "Paramètres",
    recent: "Analyses récentes",
    logout: "Déconnexion",
  },
  en: {
    newAnalysis: "New analysis",
    history: "History",
    settings: "Settings",
    recent: "Recent analyses",
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
  const t = texts[lang] || texts.fr;
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
  ];

  const settingsActive = page === "settings";

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[260px] flex-col bg-[#0F2C3D] text-white">
      <div className="px-4 pt-5">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="mb-6 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-[#16384C]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9488] shadow-sm">
            <BarChart3 size={18} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-tight">
              CAP AI
            </span>
            <span className="block text-[11px] text-white/55">
              Conversational Analytics
            </span>
          </span>
        </button>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-[#0D9488] text-white shadow-sm"
                    : "text-white/80 hover:bg-[#16384C] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-4">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
          {t.recent}
        </p>
        <div className="flex flex-col gap-1">
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectAnalysis(item.id)}
              className={`truncate rounded-xl px-3 py-2 text-left text-[13px] transition ${
                selectedId === item.id
                  ? "bg-white/12 text-white"
                  : "text-white/55 hover:bg-white/8 hover:text-white/90"
              }`}
              title={item.question}
            >
              {item.question}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-white/10 px-4 py-4">
        <div className="mb-0.5 text-sm font-medium">{user?.full_name}</div>
        <div className="mb-3 truncate text-xs text-white/50">{user?.email}</div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className={`flex items-center gap-2 text-sm transition ${
              settingsActive
                ? "text-[#5EEAD4]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Settings size={14} />
            {t.settings}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <LogOut size={14} />
            {t.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
