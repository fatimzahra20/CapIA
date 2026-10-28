from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth import UserOut, get_current_user
from app.services.pingid import (
    PINGID_DEMO,
    PINGID_ENABLED,
    authorization_url,
    sso_status,
    token_payload_for_user,
    upsert_sso_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class PingDemoRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None


@router.post("/login")
def login():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "fr": "La connexion email / mot de passe est désactivée. Utilisez PingID.",
            "en": "Email/password login is disabled. Use PingID.",
        },
    )


@router.get("/sso")
def sso_config():
    return sso_status()


@router.get("/pingid/start")
def pingid_start():
    if not PINGID_ENABLED:
        raise HTTPException(
            status_code=400,
            detail={
                "fr": "PingID n'est pas activé.",
                "en": "PingID is not enabled.",
            },
        )
    return {"authorization_url": authorization_url(), "demo": PINGID_DEMO}


@router.post("/pingid/demo")
def pingid_demo_login(payload: PingDemoRequest, db: Session = Depends(get_db)):
    """Local SSO demo for the internship (no Ping tenant required)."""
    if not PINGID_DEMO:
        raise HTTPException(
            status_code=400,
            detail={
                "fr": "Le mode démo PingID est désactivé. Configurez PINGID_ISSUER.",
                "en": "PingID demo mode is disabled. Configure PINGID_ISSUER.",
            },
        )
    user = upsert_sso_user(
        db,
        payload.email,
        payload.full_name or payload.email.split("@")[0],
    )
    return token_payload_for_user(user)


@router.get("/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)):
    return current_user
