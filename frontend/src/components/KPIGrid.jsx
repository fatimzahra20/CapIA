function formatAmount(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} DH`;
}

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function KPIGrid({ kpis, lang = "fr" }) {
  const labels =
    lang === "en"
      ? {
          rows: "Rows",
          revenue: "Revenue",
          quantity: "Units sold",
          average: "Average",
          minimum: "Minimum",
          maximum: "Maximum",
          median: "Median",
          top: "Top item",
          topShare: "Top share",
        }
      : {
          rows: "Lignes",
          revenue: "Chiffre d'affaires",
          quantity: "Unités vendues",
          average: "Moyenne",
          minimum: "Minimum",
          maximum: "Maximum",
          median: "Médiane",
          top: "Meilleur élément",
          topShare: "Part du top",
        };

  const topShare = kpis?.distribution?.[0]?.share;

  const items = [
    { label: labels.revenue, value: formatAmount(kpis?.total_amount) },
    { label: labels.quantity, value: formatNumber(kpis?.total_quantity) },
    { label: labels.average, value: formatAmount(kpis?.average) },
    { label: labels.minimum, value: formatAmount(kpis?.minimum) },
    { label: labels.maximum, value: formatAmount(kpis?.maximum) },
    { label: labels.median, value: formatAmount(kpis?.median) },
    {
      label: labels.top,
      value: kpis?.top_item?.label
        ? `${kpis.top_item.label}${
            kpis.top_item.value != null
              ? ` · ${formatNumber(kpis.top_item.value)}`
              : ""
          }`
        : "—",
    },
    {
      label: labels.topShare,
      value: topShare != null ? `${topShare} %` : "—",
    },
    { label: labels.rows, value: kpis?.row_count ?? 0 },
  ].filter((item) => item.value !== "—");

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-3.5"
        >
          <div className="mb-1 text-xs font-medium text-[#627D98]">
            {item.label}
          </div>
          <div className="text-sm font-semibold text-[#102A43]">{item.value}</div>
        </article>
      ))}
    </div>
  );
}

export default KPIGrid;
