function formatValue(value, key) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    if (Array.isArray(value)) return "—";
    if (value.label != null) {
      const share = value.share != null ? ` (${value.share}%)` : "";
      const amount =
        value.value != null && Number.isFinite(Number(value.value))
          ? ` · ${Number(value.value).toLocaleString("fr-FR")}`
          : "";
      return `${value.label}${amount}${share}`;
    }
    return "—";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    const moneyKeys = [
      "total_revenue",
      "average",
      "minimum",
      "maximum",
      "median",
    ];
    if (moneyKeys.includes(key)) {
      return value.toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString("fr-FR");
  }
  return String(value);
}

const LABELS = {
  fr: {
    row_count: "Lignes",
    column_count: "Colonnes",
    total_revenue: "Chiffre d'affaires",
    sales_count: "Nombre de ventes",
    total_quantity: "Quantité totale",
    average: "Moyenne",
    minimum: "Minimum",
    maximum: "Maximum",
    median: "Médiane",
    top_product: "Produit le plus vendu",
    top_region: "Meilleure région",
    top_customer: "Meilleur client",
  },
  en: {
    row_count: "Rows",
    column_count: "Columns",
    total_revenue: "Revenue",
    sales_count: "Sales count",
    total_quantity: "Total quantity",
    average: "Average",
    minimum: "Minimum",
    maximum: "Maximum",
    median: "Median",
    top_product: "Top product",
    top_region: "Top region",
    top_customer: "Top customer",
  },
};

function FileKPIGrid({ kpis, lang = "fr" }) {
  if (!kpis || typeof kpis !== "object") return null;
  const labels = LABELS[lang] || LABELS.fr;
  const order = [
    "total_revenue",
    "sales_count",
    "total_quantity",
    "average",
    "minimum",
    "maximum",
    "median",
    "top_product",
    "top_region",
    "top_customer",
    "row_count",
    "column_count",
  ];

  const items = order
    .filter((key) => kpis[key] !== undefined && kpis[key] !== null)
    .map((key) => ({
      key,
      label: labels[key] || key,
      value: formatValue(kpis[key], key),
    }));

  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
      <h2 className="mb-4 text-lg font-semibold text-[#102A43]">KPI</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-3.5"
          >
            <div className="mb-1 text-xs font-medium text-[#627D98]">
              {item.label}
            </div>
            <div className="text-sm font-semibold text-[#102A43]">
              {item.value}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FileKPIGrid;
