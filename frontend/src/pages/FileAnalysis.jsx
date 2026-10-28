import { useState } from "react";
import { BarChart3, Loader2, MessageSquare } from "lucide-react";
import FileUploader from "../components/file/FileUploader";
import FilePreview from "../components/file/FilePreview";
import DatasetCleaner from "../components/file/DatasetCleaner";
import FileKPIGrid from "../components/file/FileKPIGrid";
import ChartViewer from "../components/file/ChartViewer";
import AIInterpretation from "../components/file/AIInterpretation";
import ExportCleanDataset from "../components/file/ExportCleanDataset";
import ChatInput from "../components/ChatInput";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  analyzeUploadedFile,
  askUploadedFile,
  cleanAnalysisFile,
  downloadCleanDataset,
  uploadAnalysisFile,
} from "../services/api";

const SUGGESTIONS_FR = [
  "Quel est le chiffre d'affaires total ?",
  "Quel produit est le plus vendu ?",
  "Quelle région génère le plus de ventes ?",
  "Affiche les ventes par mois",
  "Quels sont les 10 meilleurs clients ?",
];

const SUGGESTIONS_EN = [
  "What is the total revenue?",
  "Which product sold the most?",
  "Which region generates the most sales?",
  "Show sales by month",
  "Who are the top 10 customers?",
];

function FileAnalysis({ lang }) {
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileId, setFileId] = useState(null);
  const [filename, setFilename] = useState("");
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [cleanReport, setCleanReport] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [qa, setQa] = useState([]);

  async function runAnalyze(id) {
    if (!id) return;
    setAnalyzing(true);
    setSuccess("");
    try {
      const data = await analyzeUploadedFile(id, lang);
      setAnalysis(data);
      setSuccess(
        lang === "en"
          ? "Analysis completed. Scroll down to see KPIs and charts."
          : "Analyse terminée. Faites défiler pour voir les KPI et graphiques.",
      );
      // Bring results into view after paint
      setTimeout(() => {
        document
          .getElementById("file-analysis-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (err) {
      setError(
        err.message ||
          (lang === "en"
            ? "Analysis failed. Check that the backend is running."
            : "Échec de l'analyse. Vérifiez que le backend est démarré."),
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleUpload(file) {
    setError("");
    setSuccess("");
    setUploading(true);
    setAnalysis(null);
    setCleanReport(null);
    setQa([]);
    try {
      const data = await uploadAnalysisFile(file);
      setFileId(data.file_id);
      setFilename(data.filename);
      setProfile(data.profile);
      setPreview(data.preview || []);
      setUploading(false);
      // Auto-run analysis right after a successful upload
      await runAnalyze(data.file_id);
    } catch (err) {
      setError(err.message || "Failed to fetch");
      setFileId(null);
      setUploading(false);
    }
  }

  async function handleClean() {
    if (!fileId) return;
    setError("");
    setCleaning(true);
    try {
      const data = await cleanAnalysisFile(fileId);
      setCleanReport(data.report);
      setProfile(data.profile);
      setPreview(data.preview || []);
      setAnalysis(null);
      await runAnalyze(fileId);
    } catch (err) {
      setError(err.message);
    } finally {
      setCleaning(false);
    }
  }

  async function handleAnalyze() {
    setError("");
    await runAnalyze(fileId);
  }

  async function handleAsk(question) {
    if (!fileId || !question.trim()) return;
    setError("");
    setAsking(true);
    setQa((prev) => [...prev, { role: "user", content: question }]);
    try {
      const data = await askUploadedFile(fileId, question, lang);
      setQa((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          chart: data.chart,
          table: data.data,
        },
      ]);
    } catch (err) {
      setQa((prev) => [
        ...prev,
        { role: "assistant", content: err.message, error: true },
      ]);
    } finally {
      setAsking(false);
    }
  }

  async function handleExport() {
    if (!fileId) return;
    try {
      const base = (filename || "dataset").replace(/\.[^.]+$/, "");
      await downloadCleanDataset(fileId, `${base}_clean.csv`);
    } catch (err) {
      setError(err.message);
    }
  }

  const suggestions = lang === "en" ? SUGGESTIONS_EN : SUGGESTIONS_FR;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-[#0D9488]">
          CAP AI · {lang === "en" ? "File intelligence" : "Intelligence fichiers"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#102A43]">
          {lang === "en" ? "File analysis" : "Analyse de fichiers"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#627D98]">
          {lang === "en"
            ? "Import Excel, CSV or PDF. CAP AI profiles the dataset, cleans it, computes KPIs, charts and answers your questions — without using PostgreSQL."
            : "Importez Excel, CSV ou PDF. CAP AI profile le dataset, le nettoie, calcule KPI et graphiques, puis répond à vos questions — sans utiliser PostgreSQL."}
        </p>
      </div>

      <div className="space-y-6">
        <FileUploader
          lang={lang}
          onFileSelected={handleUpload}
          disabled={uploading || analyzing}
        />

        {(uploading || analyzing) && (
          <p className="flex items-center gap-2 text-sm text-[#627D98]">
            <Loader2 size={16} className="animate-spin" />
            {uploading
              ? lang === "en"
                ? "Uploading and reading file…"
                : "Import et lecture du fichier…"
              : lang === "en"
                ? "Computing KPIs and charts…"
                : "Calcul des KPI et graphiques…"}
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {fileId && (
          <>
            <FilePreview lang={lang} profile={profile} preview={preview} />

            <DatasetCleaner
              lang={lang}
              report={cleanReport}
              onClean={handleClean}
              cleaning={cleaning}
              cleaned={Boolean(cleanReport)}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0F766E] disabled:opacity-50"
              >
                {analyzing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <BarChart3 size={16} />
                )}
                {analyzing
                  ? lang === "en"
                    ? "Analyzing…"
                    : "Analyse…"
                  : lang === "en"
                    ? "Run automatic analysis"
                    : "Lancer l'analyse automatique"}
              </button>
              <ExportCleanDataset
                lang={lang}
                onExport={handleExport}
                disabled={!fileId}
              />
            </div>

            <div id="file-analysis-results" className="space-y-6">
              {analysis && (
                <ErrorBoundary
                  fallback={
                    lang === "en"
                      ? "KPIs loaded, but charts failed to render. Try reloading the page."
                      : "Les KPI sont calculés, mais l'affichage des graphiques a échoué. Rechargez la page."
                  }
                >
                  <FileKPIGrid kpis={analysis.kpis} lang={lang} />
                  <ChartViewer lang={lang} charts={analysis.charts} />
                  <AIInterpretation
                    lang={lang}
                    text={analysis.interpretation}
                  />
                </ErrorBoundary>
              )}
            </div>

            <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#0D9488]" />
                <h2 className="text-lg font-semibold text-[#102A43]">
                  {lang === "en"
                    ? "Ask about this file"
                    : "Questions sur ce fichier"}
                </h2>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    disabled={asking || analyzing}
                    onClick={() => handleAsk(item)}
                    className="rounded-full border border-[#E3E8EF] bg-[#F8FAFC] px-3 py-1.5 text-[13px] text-[#486581] transition hover:border-[#0D9488]/35 hover:text-[#0F766E] disabled:opacity-50"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mb-4 space-y-3">
                {qa.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "ml-8 bg-[#0F2C3D] text-white"
                        : "mr-8 border border-[#E3E8EF] bg-[#F8FAFC] text-[#102A43]"
                    }`}
                  >
                    {msg.content}
                    {msg.table?.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr>
                              {Object.keys(msg.table[0]).map((col) => (
                                <th
                                  key={col}
                                  className="border-b border-[#E3E8EF] px-2 py-1 text-left text-[#627D98]"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.table.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {Object.keys(msg.table[0]).map((col) => (
                                  <td
                                    key={col}
                                    className="border-b border-[#E3E8EF] px-2 py-1"
                                  >
                                    {String(row[col] ?? "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
                {asking && (
                  <p className="text-sm text-[#627D98]">
                    {lang === "en" ? "Thinking…" : "Réflexion…"}
                  </p>
                )}
              </div>

              <ChatInput
                onSubmit={handleAsk}
                loading={asking}
                placeholder={
                  lang === "en"
                    ? "Ask a question about this file…"
                    : "Posez une question sur ce fichier…"
                }
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default FileAnalysis;
