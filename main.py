from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, documents, health
from app.core.config import settings
from app.db.seed import seed_demo_account
from app.db.session import Base, SessionLocal, engine
from app.models import document as document_models  # noqa: F401
from app.models import user as user_models  # noqa: F401

app = FastAPI(title="AI Document Studio Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_account(db)
    finally:
        db.close()


app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
