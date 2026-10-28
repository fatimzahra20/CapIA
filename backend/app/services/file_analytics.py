"""Compute adaptive KPIs and chart suggestions for uploaded files."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.services.file_profiler import profile_dataframe


def _find_col(roles: dict[str, str], role: str, columns: list[str]) -> str | None:
    for col, value in roles.items():
        if value == role and col in columns:
            return col
    return None


def _to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def compute_file_kpis(df: pd.DataFrame) -> dict[str, Any]:
    profile = profile_dataframe(df)
    roles = profile["roles"]
    numeric_cols = profile["numeric_columns"]

    revenue_col = _find_col(roles, "revenue", list(df.columns))
    qty_col = _find_col(roles, "quantity", list(df.columns))
    product_col = _find_col(roles, "product", list(df.columns))
    region_col = _find_col(roles, "region", list(df.columns))
    customer_col = _find_col(roles, "customer", list(df.columns))
    date_col = _find_col(roles, "date", list(df.columns))
    price_col = _find_col(roles, "price", list(df.columns))

    if revenue_col is None and numeric_cols:
        # Prefer column with "amount/sales/total" else first numeric
        for col in numeric_cols:
            low = col.lower()
            if any(k in low for k in ["amount", "sales", "total", "ca", "revenue", "montant"]):
                revenue_col = col
                break
        if revenue_col is None:
            revenue_col = numeric_cols[0]

    kpis: dict[str, Any] = {
        "row_count": int(len(df)),
        "column_count": int(df.shape[1]),
    }

    if revenue_col:
        values = _to_numeric(df[revenue_col]).dropna()
        if not values.empty:
            kpis["total_revenue"] = float(values.sum())
            kpis["average"] = float(values.mean())
            kpis["minimum"] = float(values.min())
            kpis["maximum"] = float(values.max())
            kpis["median"] = float(values.median())
            kpis["sales_count"] = int(values.count())
            kpis["revenue_column"] = revenue_col

    if qty_col:
        qty = _to_numeric(df[qty_col]).dropna()
        if not qty.empty:
            kpis["total_quantity"] = float(qty.sum())
            kpis["quantity_column"] = qty_col
    elif price_col and revenue_col is None:
        pass

    if product_col and revenue_col:
        grouped = (
            df.assign(_rev=_to_numeric(df[revenue_col]))
            .groupby(product_col, dropna=True)["_rev"]
            .sum()
            .sort_values(ascending=False)
        )
        if not grouped.empty:
            kpis["top_product"] = {
                "label": str(grouped.index[0]),
                "value": float(grouped.iloc[0]),
            }

    if region_col and revenue_col:
        grouped = (
            df.assign(_rev=_to_numeric(df[revenue_col]))
            .groupby(region_col, dropna=True)["_rev"]
            .sum()
            .sort_values(ascending=False)
        )
        if not grouped.empty:
            total = float(grouped.sum()) or 1.0
            kpis["top_region"] = {
                "label": str(grouped.index[0]),
                "value": float(grouped.iloc[0]),
                "share": round(float(grouped.iloc[0]) / total * 100, 1),
            }

    if customer_col and revenue_col:
        grouped = (
            df.assign(_rev=_to_numeric(df[revenue_col]))
            .groupby(customer_col, dropna=True)["_rev"]
            .sum()
            .sort_values(ascending=False)
        )
        if not grouped.empty:
            kpis["top_customer"] = {
                "label": str(grouped.index[0]),
                "value": float(grouped.iloc[0]),
            }

    if date_col and revenue_col:
        dates = pd.to_datetime(df[date_col], errors="coerce", dayfirst=True)
        temp = pd.DataFrame(
            {
                "period": dates.dt.to_period("M").astype(str),
                "revenue": _to_numeric(df[revenue_col]),
            }
        ).dropna()
        evolution = (
            temp.groupby("period")["revenue"].sum().sort_index().reset_index()
        )
        kpis["sales_evolution"] = [
            {"period": row["period"], "value": float(row["revenue"])}
            for _, row in evolution.iterrows()
        ]

    return kpis


def _grouped_pie(
    df: pd.DataFrame,
    label_col: str,
    revenue_col: str,
    title: str,
    limit: int = 8,
) -> dict[str, Any] | None:
    grouped = (
        df.assign(_rev=_to_numeric(df[revenue_col]))
        .groupby(label_col, dropna=True)["_rev"]
        .sum()
        .sort_values(ascending=False)
        .head(limit)
    )
    if grouped.empty:
        return None
    values = [float(v) for v in grouped.values.tolist()]
    total = sum(values) or 1.0
    shares = [round(v / total * 100, 1) for v in values]
    return {
        "type": "pie",
        "title": title,
        "labels": [str(i) for i in grouped.index.tolist()],
        "values": values,
        "shares": shares,
        "show_percent": True,
    }


def _histogram_chart(series: pd.Series, title: str, bins: int = 8) -> dict[str, Any] | None:
    values = _to_numeric(series).dropna()
    if values.empty or len(values) < 2:
        return None
    bin_count = min(bins, max(4, len(values) // 4))
    counts, edges = np.histogram(values, bins=bin_count)
    labels = [
        f"{edges[i]:,.0f}–{edges[i + 1]:,.0f}" for i in range(len(counts))
    ]
    return {
        "type": "histogram",
        "title": title,
        "labels": labels,
        "values": [int(c) for c in counts.tolist()],
    }


def _kpi_summary_bar(kpis: dict[str, Any], lang: str) -> dict[str, Any] | None:
    if lang == "en":
        mapping = [
            ("total_revenue", "Revenue"),
            ("average", "Average"),
            ("minimum", "Min"),
            ("maximum", "Max"),
            ("median", "Median"),
            ("total_quantity", "Quantity"),
        ]
        title = "KPI summary"
    else:
        mapping = [
            ("total_revenue", "CA"),
            ("average", "Moyenne"),
            ("minimum", "Min"),
            ("maximum", "Max"),
            ("median", "Médiane"),
            ("total_quantity", "Quantité"),
        ]
        title = "Résumé KPI"

    labels: list[str] = []
    values: list[float] = []
    for key, label in mapping:
        val = kpis.get(key)
        if val is not None and isinstance(val, (int, float)):
            labels.append(label)
            values.append(float(val))

    if len(labels) < 2:
        return None
    return {"type": "bar", "title": title, "labels": labels, "values": values}


def _combo_evolution_chart(
    evolution: list[dict[str, Any]], title: str
) -> dict[str, Any] | None:
    if not evolution or len(evolution) < 2:
        return None
    labels = [str(p["period"]) for p in evolution]
    values = [float(p["value"]) for p in evolution]
    cumulative: list[float] = []
    running = 0.0
    for v in values:
        running += v
        cumulative.append(running)
    return {
        "type": "combo",
        "title": title,
        "labels": labels,
        "values": values,
        "line_values": cumulative,
        "series_names": ["Valeurs", "Cumul"] if "Évolution" in title or "volution" in title else ["Values", "Cumulative"],
    }


def build_kpi_chart_bubbles(
    df: pd.DataFrame, kpis: dict[str, Any], lang: str = "fr"
) -> list[dict[str, Any]]:
    """Chart-only KPI bubbles: pie, histogram, combo, bar — no text cards."""
    profile = profile_dataframe(df)
    roles = profile["roles"]
    revenue_col = kpis.get("revenue_column") or _find_col(
        roles, "revenue", list(df.columns)
    )
    qty_col = kpis.get("quantity_column") or _find_col(
        roles, "quantity", list(df.columns)
    )
    region_col = _find_col(roles, "region", list(df.columns))
    product_col = _find_col(roles, "product", list(df.columns))
    category_col = _find_col(roles, "category", list(df.columns))
    customer_col = _find_col(roles, "customer", list(df.columns))

    titles = {
        "summary": "Résumé KPI" if lang != "en" else "KPI summary",
        "hist_rev": "Histogramme CA" if lang != "en" else "Revenue histogram",
        "hist_qty": "Histogramme quantités" if lang != "en" else "Quantity histogram",
        "region": "Camembert — Régions" if lang != "en" else "Pie — Regions",
        "product": "Camembert — Produits" if lang != "en" else "Pie — Products",
        "category": "Camembert — Catégories" if lang != "en" else "Pie — Categories",
        "customer": "Camembert — Clients" if lang != "en" else "Pie — Customers",
        "top_products": "Top produits" if lang != "en" else "Top products",
        "combo": "Combo — Évolution CA" if lang != "en" else "Combo — Sales trend",
    }

    bubbles: list[dict[str, Any]] = []

    def add_bubble(bubble_id: str, label: str, chart: dict[str, Any] | None):
        if chart:
            bubbles.append(
                {
                    "id": bubble_id,
                    "label": label,
                    "kind": "chart",
                    "chart": chart,
                }
            )

    summary = _kpi_summary_bar(kpis, lang)
    add_bubble("kpi_summary", titles["summary"], summary)

    if revenue_col:
        add_bubble(
            "hist_revenue",
            titles["hist_rev"],
            _histogram_chart(df[revenue_col], titles["hist_rev"]),
        )

    if qty_col:
        add_bubble(
            "hist_quantity",
            titles["hist_qty"],
            _histogram_chart(df[qty_col], titles["hist_qty"]),
        )

    pie_defs = [
        ("pie_region", region_col, titles["region"]),
        ("pie_product", product_col, titles["product"]),
        ("pie_category", category_col, titles["category"]),
        ("pie_customer", customer_col, titles["customer"]),
    ]
    for bubble_id, col, title in pie_defs:
        if col and revenue_col:
            chart = _grouped_pie(df, col, revenue_col, title)
            if chart and len(chart["labels"]) >= 2:
                add_bubble(bubble_id, title, chart)

    if product_col and revenue_col:
        grouped = (
            df.assign(_rev=_to_numeric(df[revenue_col]))
            .groupby(product_col, dropna=True)["_rev"]
            .sum()
            .sort_values(ascending=False)
            .head(8)
        )
        if len(grouped) >= 2:
            add_bubble(
                "bar_products",
                titles["top_products"],
                {
                    "type": "bar",
                    "title": titles["top_products"],
                    "labels": [str(i) for i in grouped.index.tolist()],
                    "values": [float(v) for v in grouped.values.tolist()],
                },
            )

    evo = kpis.get("sales_evolution") or []
    add_bubble("combo_evolution", titles["combo"], _combo_evolution_chart(evo, titles["combo"]))

    return bubbles


def build_all_kpi_charts(
    df: pd.DataFrame, kpis: dict[str, Any], lang: str = "fr"
) -> list[dict[str, Any]]:
    """Flat chart list from chart bubbles + standard charts."""
    charts: list[dict[str, Any]] = []
    for bubble in build_kpi_chart_bubbles(df, kpis, lang):
        if bubble.get("chart"):
            charts.append(bubble["chart"])
    extra = build_charts(df, kpis)
    seen_titles = {c.get("title") for c in charts}
    for chart in extra:
        if chart.get("title") not in seen_titles:
            charts.append(chart)
    return charts


def build_kpi_bubbles(
    df: pd.DataFrame, kpis: dict[str, Any], lang: str = "fr"
) -> list[dict[str, Any]]:
    """Alias — chart-only bubbles."""
    return build_kpi_chart_bubbles(df, kpis, lang)


def build_charts(df: pd.DataFrame, kpis: dict[str, Any]) -> list[dict[str, Any]]:
    profile = profile_dataframe(df)
    roles = profile["roles"]
    charts: list[dict[str, Any]] = []

    revenue_col = kpis.get("revenue_column") or _find_col(
        roles, "revenue", list(df.columns)
    )
    region_col = _find_col(roles, "region", list(df.columns))
    product_col = _find_col(roles, "product", list(df.columns))
    date_col = _find_col(roles, "date", list(df.columns))
    category_col = _find_col(roles, "category", list(df.columns))

    def bar_or_pie(label_col: str, title: str, chart_type: str = "bar"):
        if not revenue_col:
            return
        if chart_type == "pie":
            pie = _grouped_pie(df, label_col, revenue_col, title, limit=10)
            if pie:
                charts.append(pie)
            return
        grouped = (
            df.assign(_rev=_to_numeric(df[revenue_col]))
            .groupby(label_col, dropna=True)["_rev"]
            .sum()
            .sort_values(ascending=False)
            .head(10)
        )
        if grouped.empty:
            return
        charts.append(
            {
                "type": "bar",
                "title": title,
                "labels": [str(i) for i in grouped.index.tolist()],
                "values": [float(v) for v in grouped.values.tolist()],
            }
        )

    if date_col and revenue_col and kpis.get("sales_evolution"):
        evo = kpis["sales_evolution"]
        charts.append(
            {
                "type": "line",
                "title": "Évolution des ventes",
                "labels": [p["period"] for p in evo],
                "values": [p["value"] for p in evo],
                "area": True,
            }
        )

    if region_col and revenue_col:
        unique = df[region_col].nunique(dropna=True)
        bar_or_pie(
            region_col,
            "Chiffre d'affaires par région",
            "pie" if unique <= 6 else "bar",
        )

    if product_col and revenue_col:
        bar_or_pie(product_col, "Top produits", "bar")

    if category_col and revenue_col and not product_col:
        bar_or_pie(category_col, "Répartition par catégorie", "pie")

    if not charts and revenue_col:
        # fallback: distribution of first text column
        text_cols = profile["text_columns"]
        if text_cols:
            bar_or_pie(text_cols[0], f"Répartition par {text_cols[0]}", "bar")

    if not charts and profile["numeric_columns"]:
        col = profile["numeric_columns"][0]
        values = _to_numeric(df[col]).dropna().head(30)
        charts.append(
            {
                "type": "bar",
                "title": f"Aperçu — {col}",
                "labels": [str(i + 1) for i in range(len(values))],
                "values": [float(v) for v in values.tolist()],
            }
        )

    return charts


def safe_records(df: pd.DataFrame, limit: int | None = None) -> list[dict[str, Any]]:
    data = df if limit is None else df.head(limit)
    data = data.replace({np.nan: None})
    rows = []
    for record in data.to_dict(orient="records"):
        row = {}
        for key, value in record.items():
            if value is None:
                row[key] = None
            elif hasattr(value, "isoformat"):
                row[key] = value.isoformat()
            elif hasattr(value, "item"):
                row[key] = value.item()
            else:
                row[key] = value
        rows.append(row)
    return rows
