"""Detect and fix common data-quality issues."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.services.file_profiler import profile_dataframe


def analyze_and_clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    original = df.copy()
    working = df.copy()
    issues: list[dict[str, Any]] = []
    applied: list[dict[str, Any]] = []

    # Trim string whitespace
    object_cols = working.select_dtypes(include=["object", "string"]).columns
    trimmed = 0
    for col in object_cols:
        before = working[col].astype(str)
        after = before.str.strip()
        # restore real nulls
        after = after.replace({"nan": np.nan, "None": np.nan, "": np.nan})
        changed = (before != after.astype(str)).sum()
        if changed:
            trimmed += int(changed)
            working[col] = after
    if trimmed:
        issues.append(
            {
                "type": "whitespace",
                "severity": f"{trimmed} cellule(s) avec espaces inutiles",
                "severity_en": f"{trimmed} cell(s) with extra whitespace",
                "severity": "Supprimer les espaces en début/fin",
            }
        )
        applied.append(
            {
                "type": "whitespace",
                "action": "trim",
                "count": trimmed,
            }
        )

    # Empty columns
    empty_cols = [col for col in working.columns if working[col].isna().all()]
    if empty_cols:
        issues.append(
            {
                "type": "empty_columns",
                "severity": f"Colonnes vides: {', '.join(empty_cols)}",
                "severity_en": f"Empty columns: {', '.join(empty_cols)}",
                "suggestion": "Supprimer les colonnes entièrement vides",
            }
        )
        working = working.drop(columns=empty_cols)
        applied.append(
            {
                "type": "empty_columns",
                "action": "drop",
                "columns": empty_cols,
            }
        )

    # Duplicate rows
    dup_count = int(working.duplicated().sum())
    if dup_count:
        issues.append(
            {
                "type": "duplicates",
                "severity": f"{dup_count} ligne(s) en double",
                "severity_en": f"{dup_count} duplicate row(s)",
                "suggestion": "Supprimer les doublons",
            }
        )
        working = working.drop_duplicates().reset_index(drop=True)
        applied.append(
            {
                "type": "duplicates",
                "action": "drop_duplicates",
                "count": dup_count,
            }
        )

    # Missing values
    missing_total = int(working.isna().sum().sum())
    if missing_total:
        issues.append(
            {
                "type": "missing_values",
                "severity": f"{missing_total} valeur(s) manquante(s)",
                "severity_en": f"{missing_total} missing value(s)",
                "suggestion": "Remplir numériques par médiane, textes par mode",
            }
        )
        for col in working.columns:
            if working[col].isna().sum() == 0:
                continue
            numeric = pd.to_numeric(working[col], errors="coerce")
            if numeric.notna().sum() >= max(len(working) * 0.5, 1):
                median = numeric.median()
                working[col] = numeric.fillna(median)
                applied.append(
                    {
                        "type": "missing_values",
                        "action": "fillna_median",
                        "column": col,
                        "value": float(median) if pd.notna(median) else None,
                    }
                )
            else:
                mode = working[col].mode(dropna=True)
                fill = mode.iloc[0] if not mode.empty else "Inconnu"
                working[col] = working[col].fillna(fill)
                applied.append(
                    {
                        "type": "missing_values",
                        "action": "fillna_mode",
                        "column": col,
                        "value": str(fill),
                    }
                )

    # Date normalization
    date_fixed = 0
    for col in working.columns:
        sample = working[col].dropna().astype(str).head(40)
        if sample.empty:
            continue
        parsed = pd.to_datetime(sample, errors="coerce", dayfirst=True, format="mixed")
        if parsed.notna().sum() / max(len(sample), 1) < 0.7:
            continue
        converted = pd.to_datetime(
            working[col], errors="coerce", dayfirst=True, format="mixed"
        )
        if converted.notna().sum() > 0:
            date_fixed += int((converted.notna()).sum())
            working[col] = converted.dt.strftime("%Y-%m-%d")
    if date_fixed:
        issues.append(
            {
                "type": "date_format",
                "severity": "Formats de dates incohérents détectés",
                "severity_en": "Inconsistent date formats detected",
                "suggestion": "Normaliser au format YYYY-MM-DD",
            }
        )
        applied.append(
            {
                "type": "date_format",
                "action": "normalize_iso",
                "count": date_fixed,
            }
        )

    # Outliers on numeric columns (IQR)
    outlier_total = 0
    for col in working.columns:
        numeric = pd.to_numeric(working[col], errors="coerce")
        # Only treat as numeric if most values convert
        if numeric.notna().sum() < max(8, int(len(working) * 0.6)):
            continue
        q1 = numeric.quantile(0.25)
        q3 = numeric.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0 or pd.isna(iqr):
            continue
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        mask = numeric.notna() & ((numeric < lower) | (numeric > upper))
        count = int(mask.sum())
        if count:
            outlier_total += count
            # Convert column to float first to avoid dtype 'str' assignment errors
            working[col] = numeric.astype(float)
            working.loc[mask, col] = numeric.clip(lower=lower, upper=upper)[mask]
    if outlier_total:
        issues.append(
            {
                "type": "outliers",
                "severity": f"{outlier_total} valeur(s) aberrante(s) (IQR)",
                "severity_en": f"{outlier_total} outlier value(s) (IQR)",
                "suggestion": "Limiter les valeurs à l'intervalle IQR",
            }
        )
        applied.append(
            {
                "type": "outliers",
                "action": "clip_iqr",
                "count": outlier_total,
            }
        )

    # Special characters in headers already handled at parse; strip control chars in cells
    special = 0
    for col in working.select_dtypes(include=["object", "string"]).columns:
        series = working[col].astype(str)
        cleaned = series.str.replace(r"[\x00-\x1f]", "", regex=True)
        changed = int((series != cleaned).sum())
        if changed:
            special += changed
            working[col] = cleaned.replace({"nan": np.nan})
    if special:
        issues.append(
            {
                "type": "special_chars",
                "severity": f"{special} cellule(s) avec caractères de contrôle",
                "severity_en": f"{special} cell(s) with control characters",
                "suggestion": "Nettoyer les caractères spéciaux",
            }
        )
        applied.append(
            {
                "type": "special_chars",
                "action": "strip_control",
                "count": special,
            }
        )

    report = {
        "issues_detected": issues,
        "corrections_proposed": [i.get("suggestion") for i in issues],
        "corrections_applied": applied,
        "rows_before": int(len(original)),
        "rows_after": int(len(working)),
        "columns_before": int(original.shape[1]),
        "columns_after": int(working.shape[1]),
        "profile": profile_dataframe(working),
    }
    return working.reset_index(drop=True), report
