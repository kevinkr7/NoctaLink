from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class EEGFeaturesCreate(BaseModel):
    session_id: Optional[str] = None
    delta_power: float
    theta_power: float
    alpha_power: float
    beta_power: float
    gamma_power: float
    signal_quality: float = Field(..., ge=0, le=1)

class EEGFeaturesResponse(EEGFeaturesCreate):
    id: str
    user_id: str
    timestamp: datetime
