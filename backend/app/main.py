from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers import ai, regions, sales

app = FastAPI(title="CAP AI")

app.include_router(regions.router)
app.include_router(sales.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "CAP AI backend is running"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"database": "ok", "result": result}