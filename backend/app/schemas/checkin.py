from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class CheckinCreate(BaseModel):
    mood_score: int = Field(..., ge=1, le=10)
    stress_level: int = Field(..., ge=1, le=10)
    energy_level: int = Field(..., ge=1, le=10)
    notes: Optional[str] = None

class CheckinResponse(CheckinCreate):
    id: str
    user_id: str
    date: date
    created_at: datetime
