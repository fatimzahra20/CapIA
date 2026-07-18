import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { fetchDashboard } from "../services/api";

const texts = {
  fr: {
    title: "Tableau de bord commercial",
    subtitle: "Performance des ventes, régions et produits. Devise : DH.",
    loading: "Chargement du tableau de bord…",
    error:
      "Impossible de charger le tableau de bord. Vérifiez que le backend est démarré.",
    revenue: "Chiffre d'affaires",
    bestRegion: "Meilleure région",
    topProduct: "Produit phare",
    unitsSold: "Unités vendues",
    averageTicket: "Panier moyen",
    byRegion: "CA par région",
    byCategory: "CA par catégorie",
    topProducts: "Top produits",
    monthly: "Évolution mensuelle du CA",
  },
  en: {
    title: "Sales dashboard",
    subtitle: "Sales performance by region and product. Currency: DH.",
    loading: "Loading dashboard…",
    error: "Unable to load the dashboard. Make sure the backend is running.",
    revenue: "Revenue",
    bestRegion: "Best region",
    topProduct: "Top product",
    unitsSold: "Units sold",
    averageTicket: "Average ticket",
    byRegion: "Revenue by region",
    byCategory: "Revenue by category",
    topProducts: "Top products",
    monthly: "Monthly revenue trend",
  },
};

const BLUE = "#2563eb";
const PALETTE = ["#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe", "#1e40af"];

function formatDh(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} DH`;
}

function DashboardPage({ lang }) {
  const t = texts[lang];
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchDashboard();
        if (!cancelled) {
          setSummary(data);
        }
      } catch {
        if (!cancelled) {
          setError(t.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-status">{t.loading}</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-status error">{error || t.error}</p>
      </main>
    );
  }

  const totals = summary.totals || {};
  const byRegion = summary.sales_by_region || [];
  const byCategory = summary.sales_by_category || [];
  const topProducts = summary.top_products || [];
  const monthly = summary.monthly_sales || [];

  const barOption = {
    tooltip: { trigger: "axis" },
    grid: { left: "4%", right: "4%", bottom: "8%", containLabel: true },
    xAxis: {
      type: "category",
      data: byRegion.map((row) => row.name),
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: byRegion.map((row) => row.total_sales),
        itemStyle: { color: BLUE, borderRadius: [6, 6, 0, 0] },
        barWidth: "45%",
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        data: byCategory.map((row, index) => ({
          name: row.name,
          value: row.total_sales,
          itemStyle: { color: PALETTE[index % PALETTE.length] },
        })),
      },
    ],
  };

  const productsOption = {
    tooltip: { trigger: "axis" },
    grid: { left: "4%", right: "4%", bottom: "8%", containLabel: true },
    xAxis: {
      type: "category",
      data: topProducts.map((row) => row.name),
      axisLabel: { rotate: 20 },
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: topProducts.map((row) => row.total_sales),
        itemStyle: { color: "#1e40af", borderRadius: [6, 6, 0, 0] },
        barWidth: "45%",
      },
    ],
  };

  const lineOption = {
    tooltip: { trigger: "axis" },
    grid: { left: "4%", right: "4%", bottom: "8%", containLabel: true },
    xAxis: {
      type: "category",
      data: monthly.map((row) => row.month),
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        data: monthly.map((row) => row.total_sales),
        smooth: true,
        itemStyle: { color: BLUE },
        lineStyle: { color: BLUE, width: 3 },
        areaStyle: { color: "rgba(37, 99, 235, 0.12)" },
      },
    ],
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <div className="kpi-grid">
        <article>
          <h3>{t.revenue}</h3>
          <p>{formatDh(totals.total_amount)}</p>
        </article>
        <article>
          <h3>{t.bestRegion}</h3>
          <p>{summary.best_region ?? "-"}</p>
        </article>
        <article>
          <h3>{t.topProduct}</h3>
          <p>{summary.top_product ?? "-"}</p>
        </article>
        <article>
          <h3>{t.unitsSold}</h3>
          <p>{totals.total_quantity ?? 0}</p>
        </article>
        <article>
          <h3>{t.averageTicket}</h3>
          <p>{formatDh(totals.average_ticket)}</p>
        </article>
      </div>

      <div className="dashboard-charts">
        <section className="chart-card">
          <h2>{t.byRegion}</h2>
          <ReactECharts option={barOption} style={{ height: 320 }} />
        </section>
        <section className="chart-card">
          <h2>{t.byCategory}</h2>
          <ReactECharts option={pieOption} style={{ height: 320 }} />
        </section>
      </div>

      <div className="dashboard-charts">
        <section className="chart-card">
          <h2>{t.topProducts}</h2>
          <ReactECharts option={productsOption} style={{ height: 320 }} />
        </section>
        <section className="chart-card">
          <h2>{t.monthly}</h2>
          <ReactECharts option={lineOption} style={{ height: 320 }} />
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
