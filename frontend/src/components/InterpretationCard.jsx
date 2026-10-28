function InterpretationCard({ text, lang = "fr", expanded = false }) {
  if (!text) return null;

  const title = lang === "en" ? "AI interpretation" : "Interprétation IA";

  return (
    <div className="mb-1 rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-4">
      <h3 className="mb-2.5 text-sm font-semibold text-[#102A43]">{title}</h3>
      <div
        className={`whitespace-pre-wrap leading-relaxed text-[#486581] ${
          expanded ? "text-[15px]" : "text-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default InterpretationCard;
