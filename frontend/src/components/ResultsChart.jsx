import ReactECharts from "echarts-for-react";

const LABEL_KEYS = [
  "name",
  "region",
  "category",
  "product",
  "produit",
  "month",
  "mois",
  "date",
  "year",
  "annee",
];

const VALUE_KEYS = [
  "total_amount",
  "total_sales",
  "total_ventes",
  "revenue",
  "chiffre_affaires",
  "total_quantity",
  "quantity",
  "total_sold",
  "total_sales_per_region",
];

function findLabelKey(data) {
  return (
    LABEL_KEYS.find((key) =>
      data.some((row) => row[key] !== undefined && row[key] !== null),
    ) ||
    Object.keys(data[0] || {}).find((key) =>
      data.some((row) => typeof row[key] === "string"),
    )
  );
}

function findValueKey(data) {
  return (
    VALUE_KEYS.find((key) =>
      data.some((row) => typeof row[key] === "number"),
    ) ||
    Object.keys(data[0] || {}).find(
      (key) =>
        !key.toLowerCase().endsWith("id") &&
        data.some((row) => typeof row[key] === "number"),
    )
  );
}

function chooseChartType(labelKey) {
  const timeWords = ["date", "month", "mois", "year", "annee"];
  return timeWords.some((word) => labelKey?.toLowerCase().includes(word))
    ? "line"
    : "bar";
}

function ResultsChart({ data, language = "fr" }) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const labelKey = findLabelKey(data);
  const valueKey = findValueKey(data);

  if (!labelKey || !valueKey) {
    return null;
  }

  const chartType = chooseChartType(labelKey);
  const title =
    language === "en" ? "Data visualization" : "Visualisation des données";

  const option = {
    backgroundColor: "transparent",
    textStyle: {
      color: "#102A43",
    },
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#102A43",
        fontSize: 13,
        fontWeight: 500,
      },
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((row) => String(row[labelKey])),
      axisLabel: {
        rotate: data.length > 6 ? 30 : 0,
        color: "#627D98",
      },
      axisLine: {
        lineStyle: { color: "#E3E8EF" },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#627D98",
      },
      splitLine: {
        lineStyle: { color: "#EEF2F6" },
      },
    },
    series: [
      {
        name: valueKey.replaceAll("_", " "),
        type: chartType,
        data: data.map((row) => row[valueKey]),
        smooth: chartType === "line",
        itemStyle: {
          color: "#0D9488",
          borderRadius: chartType === "bar" ? [6, 6, 0, 0] : undefined,
        },
        lineStyle: {
          color: "#0D9488",
        },
        areaStyle:
          chartType === "line"
            ? {
                color: "rgba(13, 148, 136, 0.12)",
              }
            : undefined,
      },
    ],
  };

  return (
    <section className="chart-panel">
      <ReactECharts option={option} style={{ height: 400 }} />
    </section>
  );
}

export default ResultsChart;