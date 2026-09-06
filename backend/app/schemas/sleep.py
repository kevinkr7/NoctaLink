from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SleepSessionCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    quality_score: Optional[int] = Field(None, ge=1, le=100)

class SleepSessionResponse(SleepSessionCreate):
    id: str
    user_id: str
    created_at: datetime
