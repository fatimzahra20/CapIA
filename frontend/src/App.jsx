import { useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import AboutPage from "./pages/AboutPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState("fr");

  return (
    <>
      <Navbar
        page={page}
        onNavigate={setPage}
        lang={lang}
        onLangChange={setLang}
      />
      {page === "home" && (
        <HomePage
          lang={lang}
          onStart={() => setPage("analysis")}
          onDashboard={() => setPage("dashboard")}
        />
      )}
      {page === "analysis" && (
        <AnalysisPage lang={lang} onLangChange={setLang} />
      )}
      {page === "dashboard" && <DashboardPage lang={lang} />}
      {page === "history" && (
        <HistoryPage lang={lang} onAnalyze={() => setPage("analysis")} />
      )}
      {page === "about" && <AboutPage lang={lang} />}
    </>
  );
}

export default App;
