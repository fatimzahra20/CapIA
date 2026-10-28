function AIInterpretation({ lang, text }) {
  if (!text) return null;

  return (
    <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
      <h2 className="mb-3 text-lg font-semibold text-[#102A43]">
        {lang === "en" ? "AI interpretation" : "Interprétation IA"}
      </h2>
      <p className="leading-relaxed text-[#486581]">{text}</p>
    </section>
  );
}

export default AIInterpretation;
