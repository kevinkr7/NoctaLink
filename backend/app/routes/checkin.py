from fastapi import APIRouter, Depends
from app.schemas.checkin import CheckinCreate, CheckinResponse
from app.core.dependencies import get_current_user, CurrentUser
from app.database.supabase import supabase_admin
from app.services.cognitive_service import update_from_checkin
from datetime import date

router = APIRouter()

@router.post("", response_model=CheckinResponse)
def create_checkin(payload: CheckinCreate, current_user: CurrentUser = Depends(get_current_user)):
    data = {
        "user_id": current_user.id,
        "date": date.today().isoformat(),
        "mood_score": payload.mood_score,
        "stress_level": payload.stress_level,
        "energy_level": payload.energy_level,
        "notes": payload.notes
    }
    res = supabase_admin.table("daily_checkins").insert(data).execute()
    
    # Update twin
    update_from_checkin(current_user.id, data)
    
    return res.data[0]

@router.get("/today")
def get_today_checkin(current_user: CurrentUser = Depends(get_current_user)):
    res = supabase_admin.table("daily_checkins").select("*").eq("user_id", current_user.id).eq("date", date.today().isoformat()).execute()
    return res.data[0] if res.data else None

@router.get("/history")
def get_checkin_history(current_user: CurrentUser = Depends(get_current_user)):
    res = supabase_admin.table("daily_checkins").select("*").eq("user_id", current_user.id).order("date", desc=True).limit(30).execute()
    return res.data
