from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers import ai, auth, dashboard, files, regions, sales
from app.services.messages import bilingual

app = FastAPI(
    title="CAP AI",
    description="Assistant d'analyse commerciale / Sales analytics assistant",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(regions.router)
app.include_router(sales.router)
app.include_router(ai.router)
app.include_router(files.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": bilingual("backend_running")}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {
        "database": {
            "fr": "ok",
            "en": "ok",
        },
        "result": result,
    }