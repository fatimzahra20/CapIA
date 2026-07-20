function InterpretationCard({ text, lang = "fr" }) {
  if (!text) return null;

  const title = lang === "en" ? "AI interpretation" : "Interprétation IA";

  return (
    <div className="mb-4 rounded-xl border border-[#333] bg-[#2A2A2A] p-3.5">
      <h3 className="mb-2.5 text-sm font-semibold text-[#ECECEC]">{title}</h3>
      <p className="leading-relaxed text-[#ECECEC]">{text}</p>
    </div>
  );
}

export default InterpretationCard;
