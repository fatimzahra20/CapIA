import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
]);

const COLORS = [
  "#0D9488",
  "#0F2C3D",
  "#14B8A6",
  "#486581",
  "#5EEAD4",
  "#94A3B8",
  "#2DD4BF",
  "#64748B",
];

export function buildOption(chart) {
  const labels = Array.isArray(chart?.labels) ? chart.labels.map(String) : [];
  const values = Array.isArray(chart?.values)
    ? chart.values.map((v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      })
    : [];

  if (!labels.length || !values.length) return null;

  const chartType = chart?.type || "bar";
  const isPie = chartType === "pie";
  const isCombo = chartType === "combo";
  const isHistogram = chartType === "histogram";
  const isLine = chartType === "line" || Boolean(chart?.area);

  if (isPie) {
    const shares = Array.isArray(chart?.shares) ? chart.shares : null;
    return {
      backgroundColor: "transparent",
      title: {
        text: chart.title || "",
        left: "center",
        top: 4,
        textStyle: { color: "#102A43", fontSize: 12, fontWeight: 600 },
      },
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          const share =
            shares?.[params.dataIndex] ??
            (params.percent != null ? Number(params.percent).toFixed(1) : "");
          return `${params.name}<br/>${Number(params.value).toLocaleString("fr-FR")} (${share}%)`;
        },
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        bottom: 0,
        left: "center",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#486581", fontSize: 10 },
      },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "52%"],
          data: labels.map((label, i) => ({ name: label, value: values[i] })),
          label: {
            show: true,
            fontSize: 10,
            formatter: (params) => {
              const share =
                shares?.[params.dataIndex] ??
                (params.percent != null ? Number(params.percent).toFixed(0) : "");
              return `${params.name}\n${share}%`;
            },
          },
          itemStyle: { borderRadius: 5, borderColor: "#fff", borderWidth: 2 },
          color: COLORS,
        },
      ],
    };
  }

  if (isCombo) {
    const lineValues = Array.isArray(chart?.line_values)
      ? chart.line_values.map((v) => Number(v) || 0)
      : values;
    const names = chart?.series_names || ["Barres", "Ligne"];
    return {
      backgroundColor: "transparent",
      title: {
        text: chart.title || "",
        left: "center",
        textStyle: { color: "#102A43", fontSize: 12, fontWeight: 600 },
      },
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 10 } },
      grid: { left: "8%", right: "8%", bottom: "18%", containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#627D98", fontSize: 10, rotate: labels.length > 5 ? 25 : 0 },
      },
      yAxis: { type: "value", axisLabel: { color: "#627D98", fontSize: 10 } },
      series: [
        {
          name: names[0],
          type: "bar",
          data: values,
          itemStyle: { color: "#0D9488", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: names[1] || "Ligne",
          type: "line",
          data: lineValues,
          smooth: true,
          itemStyle: { color: "#0F2C3D" },
          lineStyle: { color: "#0F2C3D", width: 2 },
        },
      ],
    };
  }

  return {
    backgroundColor: "transparent",
    title: {
      text: chart.title || "",
      left: "center",
      textStyle: { color: "#102A43", fontSize: 12, fontWeight: 600 },
    },
    tooltip: { trigger: "axis" },
    grid: { left: "8%", right: "6%", bottom: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        color: "#627D98",
        fontSize: 10,
        rotate: labels.length > 5 ? 25 : 0,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#627D98", fontSize: 10 },
      splitLine: { lineStyle: { color: "#EEF2F6" } },
    },
    series: [
      {
        type: isLine ? "line" : "bar",
        data: values,
        smooth: isLine,
        itemStyle: {
          color: isHistogram ? "#14B8A6" : "#0D9488",
          borderRadius: isLine ? undefined : [4, 4, 0, 0],
        },
        lineStyle: { color: "#0D9488" },
        areaStyle: chart.area ? { color: "rgba(13, 148, 136, 0.12)" } : undefined,
      },
    ],
  };
}

function SingleChart({ chart, height = 280, compact = false }) {
  const ref = useRef(null);
  const instanceRef = useRef(null);
  const option = buildOption(chart);
  const isPie = chart?.type === "pie";
  const chartHeight = compact ? (isPie ? 200 : 180) : isPie ? 360 : height;
  const optionKey = `${chart?.type}-${chart?.title}-${(chart?.labels || []).join(",")}`;

  useEffect(() => {
    if (!ref.current || !option) return undefined;
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(ref.current);
    }
    instanceRef.current.setOption(option, true);
    const onResize = () => instanceRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionKey]);

  useEffect(
    () => () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    },
    []
  );

  if (!option) return null;

  return (
    <div
      className={`${compact ? "" : isPie ? "lg:col-span-2" : ""}`}
      style={{ width: "100%" }}
    >
      <div ref={ref} style={{ height: chartHeight, width: "100%" }} />
    </div>
  );
}

function ChartViewer({ lang, charts }) {
  const list = Array.isArray(charts) ? charts.filter((c) => buildOption(c)) : [];
  if (!list.length) return null;

  return (
    <section className="rounded-2xl border border-[#E3E8EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,42,67,0.04)]">
      <h2 className="mb-4 text-lg font-semibold text-[#102A43]">
        {lang === "en" ? "Charts" : "Graphiques"}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((chart, index) => (
          <div
            key={`${chart.title || "chart"}-${index}`}
            className="rounded-2xl border border-[#E3E8EF] bg-[#F8FAFC] p-3"
          >
            <SingleChart chart={chart} />
          </div>
        ))}
      </div>
    </section>
  );
}

export { SingleChart };
export default ChartViewer;
