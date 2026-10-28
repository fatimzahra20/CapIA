"""Store uploaded file datasets on disk (survives backend reload)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from uuid import uuid4

import pandas as pd

STORE_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "sessions"
STORE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class FileSession:
    file_id: str
    user_id: int
    filename: str
    content_type: str
    size_bytes: int
    df: pd.DataFrame
    cleaned_df: Optional[pd.DataFrame] = None
    profile: dict[str, Any] | None = None
    cleaning_report: Optional[dict[str, Any]] = None
    created_at: str = ""

    def active_df(self) -> pd.DataFrame:
        return self.cleaned_df if self.cleaned_df is not None else self.df


def _session_dir(file_id: str) -> Path:
    path = STORE_DIR / file_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _meta_path(file_id: str) -> Path:
    return _session_dir(file_id) / "meta.json"


def _raw_path(file_id: str) -> Path:
    return _session_dir(file_id) / "raw.csv"


def _clean_path(file_id: str) -> Path:
    return _session_dir(file_id) / "clean.csv"


def create_session(
    user_id: int,
    filename: str,
    content_type: str,
    size_bytes: int,
    df: pd.DataFrame,
    profile: dict[str, Any],
) -> FileSession:
    file_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    session = FileSession(
        file_id=file_id,
        user_id=user_id,
        filename=filename,
        content_type=content_type,
        size_bytes=size_bytes,
        df=df,
        profile=profile,
        created_at=created_at,
    )
    _save_session(session)
    return session


def _save_session(session: FileSession) -> None:
    meta = {
        "file_id": session.file_id,
        "user_id": session.user_id,
        "filename": session.filename,
        "content_type": session.content_type,
        "size_bytes": session.size_bytes,
        "profile": session.profile or {},
        "cleaning_report": session.cleaning_report,
        "created_at": session.created_at,
        "has_cleaned": session.cleaned_df is not None,
    }
    _meta_path(session.file_id).write_text(
        json.dumps(meta, ensure_ascii=False, default=str),
        encoding="utf-8",
    )
    session.df.to_csv(_raw_path(session.file_id), index=False)
    if session.cleaned_df is not None:
        session.cleaned_df.to_csv(_clean_path(session.file_id), index=False)


def get_session(file_id: str, user_id: int) -> Optional[FileSession]:
    meta_file = _meta_path(file_id)
    if not meta_file.exists():
        return None
    try:
        meta = json.loads(meta_file.read_text(encoding="utf-8"))
    except Exception:
        return None
    if meta.get("user_id") != user_id:
        return None
    if not _raw_path(file_id).exists():
        return None

    df = pd.read_csv(_raw_path(file_id))
    cleaned_df = None
    if meta.get("has_cleaned") and _clean_path(file_id).exists():
        cleaned_df = pd.read_csv(_clean_path(file_id))

    return FileSession(
        file_id=file_id,
        user_id=user_id,
        filename=meta.get("filename", "fichier"),
        content_type=meta.get("content_type", "application/octet-stream"),
        size_bytes=int(meta.get("size_bytes") or 0),
        df=df,
        cleaned_df=cleaned_df,
        profile=meta.get("profile") or {},
        cleaning_report=meta.get("cleaning_report"),
        created_at=meta.get("created_at") or "",
    )


def update_cleaned(
    file_id: str,
    user_id: int,
    cleaned_df: pd.DataFrame,
    report: dict[str, Any],
    profile: dict[str, Any],
) -> Optional[FileSession]:
    session = get_session(file_id, user_id)
    if not session:
        return None
    session.cleaned_df = cleaned_df
    session.cleaning_report = report
    session.profile = profile
    _save_session(session)
    return session
