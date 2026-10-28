"""Profile datasets: column types and semantic roles."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

ROLE_PATTERNS = {
    "revenue": [
        "revenue",
        "chiffre",
        "chiffre_affaires",
        "amount",
        "montant",
        "total_amount",
        "sales_amount",
        "prix_total",
        "turnover",
        "total",
        "ca",
    ],
    "price": ["price", "prix", "unit_price", "tarif", "prix_unitaire"],
    "quantity": [
        "quantity",
        "qty",
        "quantite",
        "quantité",
        "units",
        "unites",
        "unités",
        "volume",
    ],
    "product": ["product", "produit", "item", "article", "sku", "nom_produit"],
    "region": ["region", "région", "city", "ville", "zone", "area", "territoire"],
    "customer": [
        "customer",
        "client",
        "buyer",
        "acheteur",
        "customer_name",
        "nom_client",
    ],
    "date": [
        "date",
        "jour",
        "day",
        "month",
        "mois",
        "year",
        "annee",
        "année",
        "period",
        "période",
        "sale_date",
    ],
    "category": ["category", "categorie", "catégorie", "type", "segment"],
}


def _normalize_name(name: str) -> str:
    return (
        str(name)
        .strip()
        .lower()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("ù", "u")
        .replace("ô", "o")
        .replace("î", "i")
        .replace("ï", "i")
        .replace(" ", "_")
        .replace("-", "_")
    )


def detect_role(column: str) -> str | None:
    norm = _normalize_name(column)
    tokens = set(norm.split("_"))
    # Prefer longer / more specific patterns first
    ranked: list[tuple[str, str]] = []
    for role, patterns in ROLE_PATTERNS.items():
        for pattern in patterns:
            ranked.append((pattern, role))
    ranked.sort(key=lambda item: len(item[0]), reverse=True)

    for pattern, role in ranked:
        if " " in pattern:
            continue
        if pattern == norm or pattern in tokens:
            return role
        # multi-word pattern already underscore-normalized in list
        if len(pattern) >= 4 and pattern in norm:
            return role
    return None


def _is_mostly_numeric(series: pd.Series) -> bool:
    converted = pd.to_numeric(series, errors="coerce")
    non_null = series.dropna()
    if non_null.empty:
        return False
    return converted.notna().sum() / max(len(non_null), 1) >= 0.7


def _is_mostly_date(series: pd.Series) -> bool:
    if pd.api.types.is_numeric_dtype(series):
        return False
    sample = series.dropna().astype(str).head(30)
    if sample.empty:
        return False
    # Skip obvious numbers
    if sample.str.match(r"^-?\d+(\.\d+)?$").mean() > 0.8:
        return False
    parsed = pd.to_datetime(sample, errors="coerce", dayfirst=True, format="mixed")
    return parsed.notna().sum() / max(len(sample), 1) >= 0.7


def profile_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    columns: list[dict[str, Any]] = []
    numeric_cols: list[str] = []
    text_cols: list[str] = []
    date_cols: list[str] = []
    roles: dict[str, str] = {}

    for col in df.columns:
        series = df[col]
        role = detect_role(col)
        col_type = "text"

        if role == "date" or _is_mostly_date(series):
            col_type = "date"
            date_cols.append(col)
        elif _is_mostly_numeric(series) or pd.api.types.is_numeric_dtype(series):
            col_type = "numeric"
            numeric_cols.append(col)
        else:
            text_cols.append(col)

        if role:
            roles[col] = role
        elif col_type == "date":
            roles[col] = "date"
        elif col_type == "numeric" and not role:
            # heuristic fallback
            pass

        columns.append(
            {
                "name": col,
                "type": col_type,
                "role": roles.get(col),
                "null_count": int(series.isna().sum()),
                "unique_count": int(series.nunique(dropna=True)),
                "sample": [
                    None if pd.isna(v) else (v.item() if hasattr(v, "item") else v)
                    for v in series.head(3).tolist()
                ],
            }
        )

    return {
        "row_count": int(len(df)),
        "column_count": int(df.shape[1]),
        "columns": columns,
        "numeric_columns": numeric_cols,
        "text_columns": text_cols,
        "date_columns": date_cols,
        "roles": roles,
    }


def dataframe_preview(df: pd.DataFrame, limit: int = 20) -> list[dict[str, Any]]:
    preview = df.head(limit).replace({np.nan: None})
    records = preview.to_dict(orient="records")
    # Ensure JSON-serializable values
    safe: list[dict[str, Any]] = []
    for row in records:
        safe_row = {}
        for key, value in row.items():
            if value is None or (isinstance(value, float) and np.isnan(value)):
                safe_row[key] = None
            elif hasattr(value, "isoformat"):
                safe_row[key] = value.isoformat()
            elif hasattr(value, "item"):
                safe_row[key] = value.item()
            else:
                safe_row[key] = value
        safe.append(safe_row)
    return safe
