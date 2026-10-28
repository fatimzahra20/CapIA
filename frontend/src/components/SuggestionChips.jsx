import { Lightbulb, Shuffle } from "lucide-react";

function SuggestionChips({
  suggestions,
  lang = "fr",
  loading,
  onSelect,
  onShuffle,
  centered = false,
}) {
  const list = Array.isArray(suggestions) ? suggestions.filter(Boolean) : [];
  if (!list.length || !onSelect) return null;

  return (
    <div className={`mt-3 ${centered ? "text-center" : ""}`}>
      <p
        className={`mb-2 flex items-center gap-1.5 text-xs font-medium text-[#627D98] ${
          centered ? "justify-center" : ""
        }`}
      >
        <Lightbulb size={13} className="text-[#0D9488]" />
        {lang === "en" ? "Suggested questions" : "Suggestions pour vous"}
      </p>
      <div
        className={`flex flex-wrap gap-2 ${centered ? "justify-center" : ""}`}
      >
        {list.map((item) => (
          <button
            key={item}
            type="button"
            disabled={loading}
            onClick={() => onSelect(item)}
            className="rounded-full border border-[#E3E8EF] bg-white px-3.5 py-2 text-[13px] text-[#486581] shadow-sm transition hover:border-[#0D9488]/40 hover:bg-[#F0FDFA] hover:text-[#0F766E] disabled:opacity-50"
          >
            {item}
          </button>
        ))}
        {onShuffle && (
          <button
            type="button"
            disabled={loading}
            onClick={onShuffle}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#0D9488]/30 bg-[#F0FDFA] px-3.5 py-2 text-[13px] font-medium text-[#0F766E] transition hover:border-[#0D9488] disabled:opacity-50"
          >
            <Shuffle size={13} />
            {lang === "en" ? "Other prompts" : "Autres suggestions"}
          </button>
        )}
      </div>
    </div>
  );
}

export default SuggestionChips;
