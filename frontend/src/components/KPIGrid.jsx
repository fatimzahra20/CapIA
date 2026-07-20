function formatAmount(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} DH`;
}

function KPIGrid({ kpis, lang = "fr" }) {
  const labels =
    lang === "en"
      ? {
          rows: "Rows",
          revenue: "Revenue",
          quantity: "Units sold",
          top: "Top item",
        }
      : {
          rows: "Lignes",
          revenue: "Chiffre d'affaires",
          quantity: "Unités vendues",
          top: "Meilleur élément",
        };

  const items = [
    { label: labels.rows, value: kpis?.row_count ?? 0 },
    { label: labels.revenue, value: formatAmount(kpis?.total_amount) },
    { label: labels.quantity, value: kpis?.total_quantity ?? "-" },
    { label: labels.top, value: kpis?.top_item?.label ?? "-" },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-xl border border-[#333] bg-[#2A2A2A] p-3"
        >
          <div className="mb-1 text-xs text-[#A1A1AA]">{item.label}</div>
          <div className="text-base font-semibold text-white">{item.value}</div>
        </article>
      ))}
    </div>
  );
}

export default KPIGrid;
