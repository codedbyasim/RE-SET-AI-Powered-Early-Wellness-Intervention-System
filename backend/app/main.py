import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, DB_DIALECT
from app.routers import auth, checkins, interventions, insights, campus, privacy, demo

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

# ── Global Error Handler (Guarantees CORS headers on 500 errors) ───
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )

# ── CORS ──────────────────────────────────────────────────────────
_allow_all = os.getenv("ALLOW_ALL_ORIGINS", "true").lower() in ("true", "1", "yes")
_raw_origins = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173,http://localhost:3000,https://localhost:5173"
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

if _allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth.router,          prefix=settings.API_V1_STR)
app.include_router(checkins.router,      prefix=settings.API_V1_STR)
app.include_router(interventions.router, prefix=settings.API_V1_STR)
app.include_router(insights.router,      prefix=settings.API_V1_STR)
app.include_router(campus.router,        prefix=settings.API_V1_STR)
app.include_router(privacy.router,       prefix=settings.API_V1_STR)
app.include_router(demo.router,          prefix=settings.API_V1_STR)

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
