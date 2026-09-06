from app.database.supabase import supabase_admin
from app.schemas.onboarding import OnboardingAnswers
from datetime import datetime

def submit_onboarding(user_id: str, answers: OnboardingAnswers):
    data = {
        "user_id": user_id,
        "answers": answers.answers,
        "completed_at": datetime.utcnow().isoformat()
    }
    supabase_admin.table("onboarding_questionnaire").upsert(data).execute()
    return {"status": "success"}

def get_onboarding_status(user_id: str):
    res = supabase_admin.table("onboarding_questionnaire").select("completed_at").eq("user_id", user_id).execute()
    if res.data and res.data[0].get("completed_at"):
        return {"is_completed": True, "completed_at": res.data[0]["completed_at"]}
    return {"is_completed": False}
