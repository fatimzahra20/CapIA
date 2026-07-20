import { useState } from "react";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("chat");
  const [lang, setLang] = useState("fr");

  if (page === "dashboard") {
    return (
      <div className="simple-shell">
        <header className="chat-topbar">
          <button
            type="button"
            className="chat-brand linkish"
            onClick={() => setPage("chat")}
          >
            ← CAP AI
          </button>
          <div className="chat-lang">
            <button
              type="button"
              className={lang === "fr" ? "active" : ""}
              onClick={() => setLang("fr")}
            >
              FR
            </button>
            <button
              type="button"
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              EN
            </button>
          </div>
        </header>
        <DashboardPage lang={lang} />
      </div>
    );
  }

  return (
    <ChatPage
      lang={lang}
      onLangChange={setLang}
      onDashboard={() => setPage("dashboard")}
    />
  );
}

export default App;
