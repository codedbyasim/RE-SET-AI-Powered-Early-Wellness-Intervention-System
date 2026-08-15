import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, DB_DIALECT
from app.routers import auth, checkins, interventions, insights, campus, privacy

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize database schema
try:
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database schema initialized on {DB_DIALECT}")
except Exception as e:
    logger.error(f"Error creating tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Early Wellness Intervention System for Students"
)

# ── CORS ──────────────────────────────────────────────────────────
# Allow the Vercel frontend + localhost dev. 
# FRONTEND_URL env var is set in Render Dashboard once Vercel URL is known.
_raw_origins = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173,http://localhost:3000,https://localhost:5173"
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# During development / before FRONTEND_URL is set, also allow all
if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true":
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth.router,          prefix=settings.API_V1_STR)
app.include_router(checkins.router,      prefix=settings.API_V1_STR)
app.include_router(interventions.router, prefix=settings.API_V1_STR)
app.include_router(insights.router,      prefix=settings.API_V1_STR)
app.include_router(campus.router,        prefix=settings.API_V1_STR)
app.include_router(privacy.router,       prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "database": DB_DIALECT,
        "ai_model": settings.AIML_MODEL,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": DB_DIALECT, "ai_engine": "AIML API"}
