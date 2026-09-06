from pydantic import BaseModel
from datetime import datetime

class CognitiveTwinState(BaseModel):
    sleep_quality: float = 0
    sleep_duration: float = 0
    sleep_debt: float = 0
    attention_score: float = 0
    fatigue_score: float = 0
    cognitive_readiness: float = 0
    cognitive_load: float = 0
    recovery_reserve: float = 0
    recommended_sleep: float = 0
    model_version: str = "v1.0-baseline"
    updated_at: datetime

class CognitiveTwinResponse(CognitiveTwinState):
    user_id: str
