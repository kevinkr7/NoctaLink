from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PredictionRequest(BaseModel):
    # Depending on what needs to be predicted, this could take explicit features
    # or just use the user's current twin state.
    pass

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    prediction_type: str
    prediction_value: float
    confidence: Optional[float]
    timestamp: datetime

class RecoveryRecommendation(BaseModel):
    recommended_sleep_hours: float
    recovery_score: float
    reason: str
    confidence: Optional[float] = None
