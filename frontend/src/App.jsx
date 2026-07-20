import { useState } from "react";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import ChatResult from "./pages/ChatResult";
import HistoryPage from "./pages/HistoryPage";
import DatabasePage from "./pages/DatabasePage";
import SettingsPage from "./pages/SettingsPage";
import { analyzeQuestion } from "./services/api";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("fr");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(text) {
    setQuestion(text);
    setResult(null);
    setError("");
    setLoading(true);
    setPage("result");

    try {
      const data = await analyzeQuestion(text);
      if (data.language === "fr" || data.language === "en") {
        setLang(data.language);
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNewAnalysis() {
    setPage("home");
    setQuestion("");
    setResult(null);
    setError("");
    setLoading(false);
  }

  function handleNavigate(next) {
    if (next === "home") {
      handleNewAnalysis();
      return;
    }
    setPage(next);
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={handleNavigate} lang={lang} />
      <div className="app-main">
        {page === "home" && (
          <HomePage lang={lang} onAnalyze={handleAnalyze} loading={loading} />
        )}
        {page === "result" && (
          <ChatResult
            lang={lang}
            loading={loading}
            error={error}
            result={result}
            question={question}
            onReset={handleNewAnalysis}
          />
        )}
        {page === "history" && <HistoryPage lang={lang} />}
        {page === "database" && <DatabasePage lang={lang} />}
        {page === "settings" && (
          <SettingsPage lang={lang} onLangChange={setLang} />
        )}
      </div>
    </div>
  );
}

export default App;
