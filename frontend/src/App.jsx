import { useEffect, useState } from "react";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import History from "./pages/History";
import Settings from "./pages/Settings";
import {
  analyzeQuestion,
  analyzeUploadedFile,
  askUploadedFile,
  expandInterpretation,
  fetchAnalysis,
  fetchMe,
  uploadAnalysisFile,
} from "./services/api";
import {
  clearSession,
  getStoredUser,
  getToken,
  isAuthenticated,
} from "./services/auth";

const DASHBOARD_KEYWORDS = [
  "dashboard",
  "tableau de bord",
  "tableau de bord complet",
  "génère un dashboard",
  "genere un dashboard",
  "génère un tableau",
  "genere un tableau",
  "full dashboard",
  "complete dashboard",
  "analyse complète",
  "analyse complete",
  "analyse ce fichier",
  "analyze this file",
  "résume les points clés",
  "resume les points cles",
  "summarize the key insights",
  "summarize key insights",
  "points clés",
  "key insights",
];

const KPI_CHARTS_KEYWORDS = [
  "tous les kpi",
  "all kpi",
  "kpi en chart",
  "kpi en graphique",
  "kpi chart",
  "graphiques kpi",
  "montre tous les kpi",
  "show all kpi",
];

const CHART_TYPE_KEYWORDS = {
  pie: ["pie", "camembert", "circulaire", "donut"],
  histogram: ["histogramme", "histogram"],
  combo: ["combo"],
  bar: ["en barres", "en barre", "bar chart"],
  line: ["line chart", "en ligne", "courbe"],
};

function detectRequestedChartTypes(question) {
  const q = question.toLowerCase().trim();
  const wantsAll = [
    "tous les kpi",
    "tous les graphiques",
    "all kpi",
    "all charts",
    "montre tous",
    "show all",
  ].some((k) => q.includes(k));
  if (wantsAll) return null;

  const types = [];
  for (const [type, keys] of Object.entries(CHART_TYPE_KEYWORDS)) {
    if (keys.some((k) => q.includes(k))) types.push(type);
  }
  return types.length ? types : null;
}

function filterVisualsByType(bubbles, charts, types) {
  if (!types?.length) return { bubbles, charts };
  const wanted = new Set(types);
  let nextBubbles = (bubbles || []).filter((b) => wanted.has(b?.chart?.type));
  let nextCharts = (charts || []).filter((c) => wanted.has(c?.type));

  if (wanted.has("pie") && !nextBubbles.length && !nextCharts.length) {
    const source =
      (bubbles || []).find((b) => b?.chart?.labels?.length)?.chart ||
      (charts || []).find((c) => c?.labels?.length);
    if (source) {
      const values = source.values || [];
      const total = values.reduce((a, b) => a + Number(b || 0), 0) || 1;
      const pie = {
        type: "pie",
        title: source.title || "Répartition",
        labels: source.labels,
        values,
        shares: values.map((v) => Math.round((Number(v || 0) / total) * 1000) / 10),
        show_percent: true,
      };
      nextBubbles = [
        { id: "pie_only", label: pie.title, kind: "chart", chart: pie },
      ];
      nextCharts = [pie];
    }
  }
  return { bubbles: nextBubbles, charts: nextCharts };
}

function isKpiChartsRequest(question) {
  const q = question.toLowerCase().trim();
  return (
    KPI_CHARTS_KEYWORDS.some((k) => q.includes(k)) ||
    Boolean(detectRequestedChartTypes(question)) ||
    q.includes("sous forme")
  );
}

function isMoreInterpretation(question) {
  const q = question.toLowerCase().trim();
  return [
    "plus d'interprétation",
    "plus d interpretation",
    "plus d interprétation",
    "plus d'interpretation",
    "plus de détails",
    "plus de details",
    "explique plus",
    "explique-moi plus",
    "interprétation complète",
    "more interpretation",
    "more details",
    "explain more",
    "donne moi plus",
    "détaille",
    "detaille",
  ].some((k) => q.includes(k));
}

function isDashboardRequest(question, filename = "") {
  const q = question.toLowerCase().trim();
  const name = filename.toLowerCase();

  if (DASHBOARD_KEYWORDS.some((k) => q.includes(k))) return true;

  if (name.endsWith(".pdf") && q.length < 120) {
    const generic = [
      "analyse",
      "analyze",
      "résume",
      "resume",
      "summarize",
      "dashboard",
      "tableau",
      "points clés",
      "key insights",
      "complet",
      "complete",
    ];
    if (generic.some((g) => q.includes(g)) || q.split(/\s+/).length < 12) {
      return true;
    }
  }

  return false;
}

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [user, setUser] = useState(getStoredUser());
  const [page, setPage] = useState("home");
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("cap_ai_lang");
      return saved === "en" || saved === "fr" ? saved : "fr";
    } catch {
      return "fr";
    }
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fileSessions, setFileSessions] = useState({});

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
    setFileSessions({});
  }

  function handleNavigate(next) {
    if (next === "home") {
      setMessages([]);
      setSelectedId(null);
    }
    setPage(next);
  }

  async function handleAsk(question, file = null, existingFileId = null) {
    setPage("home");
    setSelectedId(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
        attachment: file
          ? {
              name: file.name,
              size: file.size,
              isImage: Boolean(file.type?.startsWith("image/")),
            }
          : existingFileId && fileSessions[existingFileId]
            ? {
                name: fileSessions[existingFileId].filename,
                size: fileSessions[existingFileId].size_bytes,
                isImage: false,
              }
            : null,
      },
    ]);
    setLoading(true);

    try {
      let result;
      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.result);
      if (
        isMoreInterpretation(question) &&
        lastAssistant?.result &&
        !file &&
        !existingFileId
      ) {
        const expanded = await expandInterpretation(
          question,
          lastAssistant.result.kpis || {},
          lastAssistant.result.data || [],
          lang
        );
        result = {
          source: lastAssistant.result.source || "database",
          language: lang,
          kpis: lastAssistant.result.kpis || {},
          kpi_bubbles: [],
          charts: [],
          data: [],
          charts_only: false,
          interpretation_only: true,
          interpretation: expanded.interpretation,
          answer: expanded.interpretation,
          interpretation_expanded: true,
          file_id: lastAssistant.result.file_id,
          suggestions: lastAssistant.result.suggestions || [],
        };
      } else if (file || existingFileId) {
        let fileId = existingFileId;
        let filename = file?.name || fileSessions[existingFileId]?.filename || "";

        if (file && !existingFileId) {
          const uploaded = await uploadAnalysisFile(file);
          fileId = uploaded.file_id;
          filename = uploaded.filename;
          setFileSessions((prev) => ({
            ...prev,
            [fileId]: {
              filename: uploaded.filename,
              size_bytes: uploaded.size_bytes,
              suggestions: uploaded.suggestions || [],
            },
          }));
        }

        const wantedTypes = detectRequestedChartTypes(question);
        const dashboardMode =
          !wantedTypes &&
          (isDashboardRequest(question, filename || "") ||
            isKpiChartsRequest(question));

        if (dashboardMode) {
          const analyzed = await analyzeUploadedFile(fileId, lang);
          const filtered = filterVisualsByType(
            analyzed.kpi_bubbles || [],
            analyzed.charts || [],
            wantedTypes
          );
          result = {
            source: "file",
            mode: "dashboard",
            charts_only: true,
            language: lang,
            interpretation: analyzed.interpretation,
            answer: analyzed.interpretation,
            kpis: analyzed.kpis || {},
            kpi_bubbles: filtered.bubbles,
            data: [],
            charts: filtered.charts,
            suggestions: analyzed.suggestions || [],
            filename: analyzed.filename || filename,
            file_id: fileId,
          };
          setFileSessions((prev) => ({
            ...prev,
            [fileId]: {
              ...(prev[fileId] || {}),
              filename: analyzed.filename || filename,
              suggestions: analyzed.suggestions || prev[fileId]?.suggestions || [],
            },
          }));
        } else {
          const askResult = await askUploadedFile(fileId, question, lang);
          const session = fileSessions[fileId];
          const wantedAsk = detectRequestedChartTypes(question);
          const filteredAsk = filterVisualsByType(
            askResult.kpi_bubbles || [],
            askResult.charts?.length
              ? askResult.charts
              : askResult.chart
                ? [askResult.chart]
                : [],
            wantedAsk
          );
          result = {
            source: "file",
            charts_only: Boolean(askResult.charts_only || wantedAsk) && !askResult.interpretation_expanded,
            mode: askResult.mode || null,
            language: lang,
            interpretation: askResult.answer,
            answer: askResult.answer,
            kpis: askResult.kpis || {},
            kpi_bubbles: askResult.interpretation_expanded ? [] : filteredAsk.bubbles,
            data:
              askResult.interpretation_expanded || askResult.charts_only || wantedAsk
                ? []
                : askResult.data || [],
            charts: askResult.interpretation_expanded ? [] : filteredAsk.charts,
            interpretation_only: Boolean(askResult.interpretation_expanded || askResult.interpretation_only),
            interpretation_expanded: Boolean(askResult.interpretation_expanded),
            suggestions: askResult.suggestions?.length
              ? askResult.suggestions
              : session?.suggestions || [],
            filename: filename || askResult.filename,
            file_id: fileId,
          };
          setFileSessions((prev) => ({
            ...prev,
            [fileId]: {
              ...(prev[fileId] || {}),
              filename: filename || askResult.filename,
              suggestions: session?.suggestions || prev[fileId]?.suggestions || [],
            },
          }));
        }
      } else {
        result = await analyzeQuestion(question, lang);
        const wantedDb = detectRequestedChartTypes(question);
        const filteredDb = filterVisualsByType(
          result.kpi_bubbles || [],
          result.charts || [],
          wantedDb
        );
        result = {
          ...result,
          source: "database",
          language: lang,
          kpi_bubbles: result.interpretation_expanded ? [] : filteredDb.bubbles,
          charts: result.interpretation_expanded ? [] : filteredDb.charts,
          charts_only: Boolean(result.charts_only || wantedDb) && !result.interpretation_expanded,
          interpretation_only: Boolean(result.interpretation_expanded),
          data: result.charts_only || wantedDb || result.interpretation_expanded ? [] : result.data,
          suggestions: result.suggestions || [],
        };
        if (result.id) {
          setSelectedId(result.id);
        }
      }

      setRefreshKey((value) => value + 1);

      setMessages((prev) => [...prev, { role: "assistant", result }]);
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
        { role: "assistant", result: { ...result, source: "database" } },
      ]);
    } catch (err) {
      setMessages([{ role: "assistant", error: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <Login
        onSuccess={(nextUser) => {
          setUser(nextUser);
          setAuthed(true);
        }}
      />
    );
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
          key={`home-${lang}`}
          lang={lang}
          messages={messages}
          loading={loading}
          onAsk={handleAsk}
        />
      )}
      {page === "history" && (
        <History key={`history-${lang}`} lang={lang} user={user} onSelect={handleSelectAnalysis} />
      )}
      {page === "settings" && (
        <Settings
          key={`settings-${lang}`}
          lang={lang}
          onLangChange={(next) => {
            const chosen = next === "en" ? "en" : "fr";
            setLang(chosen);
            try {
              localStorage.setItem("cap_ai_lang", chosen);
            } catch {
              /* ignore */
            }
          }}
          user={user}
          onLogout={handleLogout}
        />
      )}
    </MainLayout>
  );
}

export default App;
