import { Sparkles, Wand2 } from "lucide-react";

function DatasetCleaner({ lang, report, onClean, cleaning, cleaned }) {
  return (
    <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#102A43]">
            {lang === "en" ? "Smart data cleaning" : "Nettoyage intelligent"}
          </h2>
          <p className="mt-1 text-sm text-[#627D98]">
            {lang === "en"
              ? "Detect missing values, duplicates, outliers and more."
              : "Détecte valeurs manquantes, doublons, outliers, etc."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClean}
          disabled={cleaning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C3D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#16384C] disabled:opacity-50"
        >
          <Wand2 size={16} />
          {cleaning
            ? lang === "en"
              ? "Cleaning…"
              : "Nettoyage…"
            : cleaned
              ? lang === "en"
                ? "Clean again"
                : "Nettoyer à nouveau"
              : lang === "en"
                ? "Clean dataset"
                : "Nettoyer le dataset"}
        </button>
      </div>

      {!report && (
        <p className="text-sm text-[#627D98]">
          {lang === "en"
            ? "Run cleaning to generate a quality report."
            : "Lancez le nettoyage pour générer un rapport qualité."}
        </p>
      )}

      {report && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#102A43]">
              <Sparkles size={14} className="text-[#0D9488]" />
              {lang === "en" ? "Issues detected" : "Problèmes détectés"}
            </div>
            <ul className="space-y-2 text-sm text-[#486581]">
              {(report.issues_detected || []).length === 0 && (
                <li>
                  {lang === "en"
                    ? "No major issue detected."
                    : "Aucun problème majeur détecté."}
                </li>
              )}
              {(report.issues_detected || []).map((issue, i) => (
                <li key={i}>
                  • {lang === "en" ? issue.severity_en || issue.severity : issue.severity}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] p-4">
            <div className="mb-2 text-sm font-semibold text-[#102A43]">
              {lang === "en" ? "Proposed fixes" : "Corrections proposées"}
            </div>
            <ul className="space-y-2 text-sm text-[#486581]">
              {(report.corrections_proposed || []).map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
              {(report.corrections_proposed || []).length === 0 && (
                <li>—</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-[#E3E8EF] bg-[#F8FAFC] p-4">
            <div className="mb-2 text-sm font-semibold text-[#102A43]">
              {lang === "en" ? "Applied fixes" : "Corrections appliquées"}
            </div>
            <ul className="space-y-2 text-sm text-[#486581]">
              {(report.corrections_applied || []).map((item, i) => (
                <li key={i}>
                  • {item.type}
                  {item.count != null ? ` (${item.count})` : ""}
                  {item.column ? ` — ${item.column}` : ""}
                </li>
              ))}
              {(report.corrections_applied || []).length === 0 && <li>—</li>}
            </ul>
            <p className="mt-3 text-xs text-[#627D98]">
              {report.rows_before} → {report.rows_after}{" "}
              {lang === "en" ? "rows" : "lignes"} · {report.columns_before} →{" "}
              {report.columns_after}{" "}
              {lang === "en" ? "columns" : "colonnes"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default DatasetCleaner;
