from fastapi import APIRouter, Depends
from app.schemas.prediction import RecoveryRecommendation
from app.services.recovery_service import generate_recovery_recommendation
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.post("/recommend", response_model=RecoveryRecommendation)
def get_recovery_recommendation(current_user: CurrentUser = Depends(get_current_user)):
    return generate_recovery_recommendation(current_user.id)
