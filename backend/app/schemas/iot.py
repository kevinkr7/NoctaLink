from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class IoT_EEGData(BaseModel):
    delta_power: float
    theta_power: float
    alpha_power: float
    beta_power: float
    gamma_power: float
    
    relative_delta: Optional[float] = None
    relative_theta: Optional[float] = None
    relative_alpha: Optional[float] = None
    relative_beta: Optional[float] = None
    relative_gamma: Optional[float] = None
    
    theta_alpha_ratio: Optional[float] = None
    beta_alpha_ratio: Optional[float] = None

class IoTEEGPayload(BaseModel):
    device_id: str
    timestamp: datetime
    session_type: str
    signal_quality: float = Field(..., ge=0.0, le=1.0)
    eeg: IoT_EEGData

class IoTEEGResponse(BaseModel):
    id: str
    message: str
    status: str
