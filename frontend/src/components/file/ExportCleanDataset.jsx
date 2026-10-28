import { Download } from "lucide-react";

function ExportCleanDataset({ lang, onExport, disabled }) {
  return (
    <button
      type="button"
      onClick={onExport}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl border border-[#E3E8EF] bg-white px-4 py-2.5 text-sm font-medium text-[#486581] shadow-sm transition hover:border-[#0D9488]/40 hover:text-[#0F766E] disabled:opacity-50"
    >
      <Download size={16} />
      {lang === "en" ? "Download cleaned file" : "Télécharger le fichier nettoyé"}
    </button>
  );
}

export default ExportCleanDataset;
