from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class OnboardingAnswers(BaseModel):
    answers: Dict[str, Any]

class OnboardingStatus(BaseModel):
    is_completed: bool
    completed_at: Optional[datetime] = None
