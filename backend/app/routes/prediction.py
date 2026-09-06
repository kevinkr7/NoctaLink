from fastapi import APIRouter, Depends
from app.schemas.prediction import PredictionResponse
from app.services.prediction_service import make_cognitive_prediction
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.post("/cognitive", response_model=PredictionResponse)
def get_cognitive_prediction(current_user: CurrentUser = Depends(get_current_user)):
    return make_cognitive_prediction(current_user.id)
