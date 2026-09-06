from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProfileBase(BaseModel):
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    occupation: Optional[str] = None
    country: Optional[str] = None
    profile_picture: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

class MedicalHistoryBase(BaseModel):
    diagnosed_conditions: List[str] = []
    current_medications: List[str] = []
    allergies: List[str] = []

class MedicalHistoryResponse(MedicalHistoryBase):
    user_id: str
    created_at: datetime
    updated_at: datetime

class LifestyleBase(BaseModel):
    caffeine_intake_mg_per_day: int = 0
    exercise_frequency_per_week: int = 0
    alcohol_consumption_per_week: int = 0

class LifestyleResponse(LifestyleBase):
    user_id: str
    created_at: datetime
    updated_at: datetime
