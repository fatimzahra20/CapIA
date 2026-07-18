import { useState } from "react";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");

  if (page === "home") {
    return <HomePage onStart={() => setPage("analysis")} />;
  }

  return <AnalysisPage onHome={() => setPage("home")} />;
}

export default App;
