from fastapi import APIRouter, Depends
from app.schemas.onboarding import OnboardingAnswers, OnboardingStatus
from app.services.onboarding_service import submit_onboarding, get_onboarding_status
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.post("/answers")
def save_answers(payload: OnboardingAnswers, current_user: CurrentUser = Depends(get_current_user)):
    return submit_onboarding(current_user.id, payload)

@router.get("/status", response_model=OnboardingStatus)
def check_status(current_user: CurrentUser = Depends(get_current_user)):
    return get_onboarding_status(current_user.id)

@router.post("/complete")
def complete_onboarding(current_user: CurrentUser = Depends(get_current_user)):
    from app.services.cognitive_service import get_cognitive_twin
    from app.database.supabase import supabase_admin
    
    # Initialize the cognitive twin
    get_cognitive_twin(current_user.id)
    
    # Mark initialization as completed in the database
    supabase_admin.table("profiles").update({"initialization_completed": True}).eq("id", current_user.id).execute()
    
    return {"message": "Onboarding marked as complete"}
