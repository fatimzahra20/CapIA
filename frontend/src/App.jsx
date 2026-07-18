import { useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import DashboardPage from "./pages/DashboardPage";
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
    </>
  );
}

export default App;
