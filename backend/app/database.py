import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

# Function to initialize database engine with resilient fallback
def create_resilient_engine():
    pg_url = settings.DATABASE_URL
    try:
        # Attempt PostgreSQL connection
        engine = create_engine(
            pg_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to Supabase PostgreSQL!")
        return engine, "postgresql"
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite storage.")
        sqlite_engine = create_engine(
            settings.SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine, "sqlite"

engine, DB_DIALECT = create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
