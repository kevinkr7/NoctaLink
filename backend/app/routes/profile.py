from fastapi import APIRouter, Depends
from app.schemas.profile import ProfileBase, ProfileResponse, MedicalHistoryBase, MedicalHistoryResponse, LifestyleBase, LifestyleResponse
from app.services.profile_service import get_profile, update_profile, get_medical_history, update_medical_history, get_lifestyle, update_lifestyle
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.get("", response_model=ProfileResponse)
def get_user_profile(current_user: CurrentUser = Depends(get_current_user)):
    profile = get_profile(current_user.id)
    if not profile:
        return {"id": current_user.id, "created_at": "now", "updated_at": "now"} # Simplified for now
    return profile

@router.put("", response_model=ProfileResponse)
def update_user_profile(payload: ProfileBase, current_user: CurrentUser = Depends(get_current_user)):
    return update_profile(current_user.id, payload)

@router.get("/medical", response_model=MedicalHistoryResponse)
def get_user_medical_history(current_user: CurrentUser = Depends(get_current_user)):
    history = get_medical_history(current_user.id)
    if not history:
        return {"user_id": current_user.id, "created_at": "now", "updated_at": "now"}
    return history

@router.put("/medical", response_model=MedicalHistoryResponse)
def update_user_medical_history(payload: MedicalHistoryBase, current_user: CurrentUser = Depends(get_current_user)):
    return update_medical_history(current_user.id, payload)

@router.get("/lifestyle", response_model=LifestyleResponse)
def get_user_lifestyle(current_user: CurrentUser = Depends(get_current_user)):
    lifestyle = get_lifestyle(current_user.id)
    if not lifestyle:
        return {"user_id": current_user.id, "created_at": "now", "updated_at": "now"}
    return lifestyle

@router.put("/lifestyle", response_model=LifestyleResponse)
def update_user_lifestyle(payload: LifestyleBase, current_user: CurrentUser = Depends(get_current_user)):
    return update_lifestyle(current_user.id, payload)
