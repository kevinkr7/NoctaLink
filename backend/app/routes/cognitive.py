from fastapi import APIRouter, Depends
from app.schemas.cognitive import CognitiveTwinResponse, CognitiveTwinState
from app.services.cognitive_service import get_cognitive_twin
from app.core.dependencies import get_current_user, CurrentUser

router = APIRouter()

@router.get("", response_model=CognitiveTwinResponse)
def get_twin(current_user: CurrentUser = Depends(get_current_user)):
    return get_cognitive_twin(current_user.id)

@router.get("/dashboard")
def get_dashboard_data(current_user: CurrentUser = Depends(get_current_user)):
    from app.database.supabase import supabase_admin
    user_id = current_user.id
    
    # 1. Get Profile & Status
    profile_res = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
    profile = profile_res.data[0] if profile_res.data else {}
    
    twin_status = "not_initialized"
    if profile.get("initialization_completed"):
        twin_status = "active"
        
    # 2. Get Current Cognitive Twin State
    twin = get_cognitive_twin(user_id)
    
    # 3. Get Recent Predictions (History)
    # We will query the predictions table, but pivot it or just return recent twin state history.
    # The frontend expects an array of prediction objects. 
    # For MVP, we can mock the history or pull from a daily aggregated table.
    
    return {
        "profile": {
            "display_name": profile.get("display_name"),
            "profile_picture": profile.get("profile_picture"),
        },
        "twin_status": twin_status,
        "current_state": twin,
        # Returning mock history to satisfy frontend charts while backend generates real history over time
        "predictions_history": [
            {
                "prediction_date": "2026-08-28T10:00:00Z",
                "cognitive_readiness": twin.get("cognitive_readiness", 80),
                "fatigue_score": twin.get("fatigue_score", 20),
                "attention_score": twin.get("attention_score", 85)
            },
            {
                "prediction_date": "2026-08-27T10:00:00Z",
                "cognitive_readiness": 75,
                "fatigue_score": 25,
                "attention_score": 80
            }
        ]
    }
