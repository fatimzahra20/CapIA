import { SingleChart } from "./file/ChartViewer";

const TYPE_BADGE = {
  pie: "Pie",
  bar: "Bar",
  histogram: "Histogram",
  combo: "Combo",
  line: "Line",
};

function KPIBubbleGrid({ bubbles, lang = "fr" }) {
  const list = Array.isArray(bubbles)
    ? bubbles.filter((b) => b?.kind === "chart" && b?.chart)
    : [];

  if (!list.length) return null;

  return (
    <section className="mb-4">
      <h2 className="mb-4 text-lg font-semibold text-[#102A43]">
        {lang === "en" ? "KPI charts" : "KPI en graphiques"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((bubble) => {
          const chartType = bubble.chart?.type || "bar";
          return (
            <article
              key={bubble.id}
              className="relative overflow-hidden rounded-[28px] border-2 border-[#99F6E4] bg-gradient-to-br from-[#F0FDFA] to-white p-4 shadow-[0_8px_30px_rgba(13,148,136,0.12)] transition hover:shadow-[0_12px_40px_rgba(13,148,136,0.18)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#0F766E]">
                  {bubble.label}
                </span>
                <span className="rounded-full bg-[#0D9488] px-2 py-0.5 text-[10px] font-semibold text-white">
                  {TYPE_BADGE[chartType] || chartType}
                </span>
              </div>
              <SingleChart chart={bubble.chart} compact />
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default KPIBubbleGrid;
