import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use SQLite for development/demo (in production, use PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../../shared_microservices.db")

# Fix empty DATABASE_URL issue
if not DATABASE_URL or not DATABASE_URL.strip():
    DATABASE_URL = "sqlite:///../../shared_microservices.db"

# Database configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL configuration with SSL and connection pool
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "sslmode": "require",
            "options": "-c timezone=utc"
        } if "neon.tech" in DATABASE_URL else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()