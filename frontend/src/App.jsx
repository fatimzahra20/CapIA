import { useEffect, useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import History from "./pages/History";
import Database from "./pages/Database";
import Settings from "./pages/Settings";
import {
  analyzeQuestion,
  fetchAnalysis,
  fetchMe,
} from "./services/api";
import {
  clearSession,
  getStoredUser,
  getToken,
  isAuthenticated,
} from "./services/auth";

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(getStoredUser());
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("fr");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setAuthed(false);
      return;
    }
    fetchMe()
      .then((me) => {
        setUser(me);
        setAuthed(true);
      })
      .catch(() => {
        clearSession();
        setAuthed(false);
        setUser(null);
      });
  }, []);

  function handleLogout() {
    clearSession();
    setAuthed(false);
    setUser(null);
    setMessages([]);
    setSelectedId(null);
    setPage("home");
  }

  function handleNavigate(next) {
    if (next === "home") {
      setMessages([]);
      setSelectedId(null);
    }
    setPage(next);
  }

  async function handleAsk(question) {
    setPage("home");
    setSelectedId(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const result = await analyzeQuestion(question);
      if (result.language === "fr" || result.language === "en") {
        setLang(result.language);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", result },
      ]);
      if (result.id) {
        setSelectedId(result.id);
      }
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", error: err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectAnalysis(id) {
    setPage("home");
    setSelectedId(id);
    setLoading(true);
    try {
      const item = await fetchAnalysis(id);
      const result = item.result_json || {
        question: item.question,
        interpretation: item.interpretation,
        data: [],
        kpis: {},
        language: lang,
      };
      setMessages([
        { role: "user", content: item.question },
        { role: "assistant", result },
      ]);
    } catch (err) {
      setMessages([
        { role: "assistant", error: err.message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return <Login onSuccess={(nextUser) => {
      setUser(nextUser);
      setAuthed(true);
    }} />;
  }

  return (
    <MainLayout
      page={page}
      selectedId={selectedId}
      onNavigate={handleNavigate}
      onSelectAnalysis={handleSelectAnalysis}
      onLogout={handleLogout}
      user={user}
      lang={lang}
      refreshKey={refreshKey}
    >
      {page === "home" && (
        <Home
          lang={lang}
          messages={messages}
          loading={loading}
          onAsk={handleAsk}
        />
      )}
      {page === "history" && (
        <History lang={lang} onSelect={handleSelectAnalysis} />
      )}
      {page === "database" && <Database lang={lang} />}
      {page === "settings" && (
        <Settings
          lang={lang}
          onLangChange={setLang}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </MainLayout>
  );
}

export default App;
