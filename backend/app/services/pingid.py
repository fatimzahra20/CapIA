"""PingID / PingOne OIDC helpers.

Production: Authorization Code flow against PingOne or PingFederate.
Internship/dev: PINGID_DEMO=true simulates the SSO handshake locally
so the UI and auth_provider='pingid' can be demonstrated without a tenant.
"""

from __future__ import annotations

import os
import secrets
from typing import Any
from urllib.parse import urlencode

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.auth import create_access_token, get_user_by_email

PINGID_ENABLED = os.getenv("PINGID_ENABLED", "true").lower() in ("1", "true", "yes")
PINGID_DEMO = os.getenv("PINGID_DEMO", "true").lower() in ("1", "true", "yes")
PING_ISSUER = os.getenv("PINGID_ISSUER", "").rstrip("/")
PING_CLIENT_ID = os.getenv("PINGID_CLIENT_ID", "")
PING_CLIENT_SECRET = os.getenv("PINGID_CLIENT_SECRET", "")
PING_REDIRECT_URI = os.getenv(
    "PINGID_REDIRECT_URI", "http://127.0.0.1:8000/auth/pingid/callback"
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")

UNUSABLE_HASH = "$2b$12$notapasswordnotapasswordnotapasswo7uY0eNqCqCqCqCqCqCq"


def sso_status() -> dict[str, Any]:
    ready = bool(PING_ISSUER and PING_CLIENT_ID)
    return {
        "pingid_enabled": PINGID_ENABLED,
        "pingid_demo": PINGID_DEMO,
        "pingid_configured": ready,
        "issuer": PING_ISSUER or None,
    }


def authorization_url() -> str:
    if PINGID_DEMO and not (PING_ISSUER and PING_CLIENT_ID):
        return f"{FRONTEND_URL}/?sso=pingid-demo"
    params = {
        "client_id": PING_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": PING_REDIRECT_URI,
        "state": secrets.token_urlsafe(16),
    }
    authorize = f"{PING_ISSUER}/as/authorize"
    return f"{authorize}?{urlencode(params)}"


def upsert_sso_user(db: Session, email: str, full_name: str) -> dict:
    db.execute(
        text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'local'"
        )
    )
    existing = get_user_by_email(db, email)
    if existing:
        db.execute(
            text(
                """
                UPDATE users
                SET auth_provider = 'pingid'
                WHERE id = :id
                """
            ),
            {"id": existing["id"]},
        )
        db.commit()
        existing["auth_provider"] = "pingid"
        return existing

    row = db.execute(
        text(
            """
            INSERT INTO users (email, password_hash, full_name, auth_provider)
            VALUES (:email, :password_hash, :full_name, 'pingid')
            RETURNING id, email, full_name, auth_provider
            """
        ),
        {
            "email": email,
            "password_hash": UNUSABLE_HASH,
            "full_name": full_name or email.split("@")[0],
        },
    ).mappings().first()
    db.commit()
    return dict(row)


def token_payload_for_user(user: dict) -> dict:
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "auth_provider": "pingid",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "auth_provider": "pingid",
        },
    }
