from fastapi import APIRouter, Depends
from app.schemas.eeg import EEGFeaturesCreate, EEGFeaturesResponse
from app.services.sleep_service import add_eeg_features
from app.services.cognitive_service import update_from_sleep
from app.core.dependencies import get_current_user, CurrentUser
from app.database.supabase import supabase_admin

router = APIRouter()

@router.post("/session")
def start_eeg_session(current_user: CurrentUser = Depends(get_current_user)):
    return {"message": "EEG session started (placeholder)"}

@router.post("/features", response_model=EEGFeaturesResponse)
def submit_eeg_features(payload: EEGFeaturesCreate, current_user: CurrentUser = Depends(get_current_user)):
    res = add_eeg_features(current_user.id, payload)
    
    # If this is linked to a session, we might want to update the cognitive twin
    if payload.session_id:
        sleep_data = supabase_admin.table("sleep_sessions").select("*").eq("id", payload.session_id).execute()
        if sleep_data.data:
            update_from_sleep(current_user.id, sleep_data.data[0], payload.model_dump())

    return res

@router.get("/latest")
def get_latest_eeg(current_user: CurrentUser = Depends(get_current_user)):
    res = supabase_admin.table("eeg_features").select("*").eq("user_id", current_user.id).order("timestamp", desc=True).limit(1).execute()
    return res.data[0] if res.data else None
