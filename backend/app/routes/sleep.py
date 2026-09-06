from fastapi import APIRouter, Depends
from app.schemas.sleep import SleepSessionCreate, SleepSessionResponse
from app.services.sleep_service import add_sleep_session, get_latest_sleep, get_sleep_history
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.post("", response_model=SleepSessionResponse)
def create_sleep_session(payload: SleepSessionCreate, current_user: CurrentUser = Depends(get_current_user)):
    return add_sleep_session(current_user.id, payload)

@router.get("/latest")
def get_latest(current_user: CurrentUser = Depends(get_current_user)):
    return get_latest_sleep(current_user.id)

@router.get("/history")
def get_history(current_user: CurrentUser = Depends(get_current_user)):
    return get_sleep_history(current_user.id)
