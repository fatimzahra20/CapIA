"""Load difficult_dataset.csv into PostgreSQL (CAP AI sales data)."""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import engine  # noqa: E402

CSV_PATH = ROOT / "data" / "difficult_dataset.csv"
MIGRATE_SQL = ROOT / "sql" / "migrate_dataset.sql"


def load() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"Dataset introuvable: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)
    df.columns = [c.strip() for c in df.columns]
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Sales"] = pd.to_numeric(df["Sales"], errors="coerce")
    df["Cost"] = pd.to_numeric(df["Cost"], errors="coerce")
    df["Profit"] = pd.to_numeric(df["Profit"], errors="coerce")
    df["Region"] = df["Region"].fillna("Unknown").astype(str).str.strip()
    df["Description"] = df["Description"].fillna("").astype(str).str.strip()
    df["MixedColumn"] = df["MixedColumn"].fillna("").astype(str).str.strip()
    df = df.dropna(subset=["Date"])

    migrate = MIGRATE_SQL.read_text(encoding="utf-8")
    with engine.begin() as conn:
        conn.execute(text(migrate))
        conn.execute(text("DELETE FROM sales"))

        for region in sorted(df["Region"].unique()):
            conn.execute(
                text(
                    """
                    INSERT INTO regions (name)
                    SELECT :name
                    WHERE NOT EXISTS (
                        SELECT 1 FROM regions WHERE lower(name) = lower(:name)
                    )
                    """
                ),
                {"name": region},
            )

        regions = {
            row["name"]: row["id"]
            for row in conn.execute(text("SELECT id, name FROM regions")).mappings()
        }
        region_map = {name.lower(): rid for name, rid in regions.items()}

        inserted = 0
        for _, row in df.iterrows():
            rid = region_map.get(str(row["Region"]).lower())
            if not rid:
                continue
            sales = None if pd.isna(row["Sales"]) else float(row["Sales"])
            cost = None if pd.isna(row["Cost"]) else float(row["Cost"])
            profit = None if pd.isna(row["Profit"]) else float(row["Profit"])
            conn.execute(
                text(
                    """
                    INSERT INTO sales (
                        sale_date, region_id, product_id, quantity,
                        total_amount, cost, profit, description, mixed_column
                    )
                    VALUES (
                        :sale_date, :region_id, NULL, 1,
                        :total_amount, :cost, :profit, :description, :mixed_column
                    )
                    """
                ),
                {
                    "sale_date": row["Date"].date(),
                    "region_id": rid,
                    "total_amount": sales if sales is not None else 0.0,
                    "cost": cost,
                    "profit": profit,
                    "description": row["Description"] or None,
                    "mixed_column": row["MixedColumn"] or None,
                },
            )
            inserted += 1

    print(f"Chargé {inserted} lignes depuis {CSV_PATH.name}")


if __name__ == "__main__":
    load()
