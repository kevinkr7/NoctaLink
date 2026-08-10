import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# The user can set this in a .env file later, but we provide the requested fallback.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:9626112901aA!@db.sgffgtcgpbfiavogckqo.supabase.co:5432/postgres")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
