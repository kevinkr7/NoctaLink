from app.database.supabase import supabase_admin
from app.schemas.profile import ProfileBase, MedicalHistoryBase, LifestyleBase
from fastapi import HTTPException, status

def get_profile(user_id: str):
    res = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None

def update_profile(user_id: str, profile_data: ProfileBase):
    # Upsert pattern
    data = {"id": user_id, **profile_data.model_dump(exclude_unset=True)}
    res = supabase_admin.table("profiles").upsert(data).execute()
    return res.data[0]

def get_medical_history(user_id: str):
    res = supabase_admin.table("medical_history").select("*").eq("user_id", user_id).execute()
    return res.data[0] if res.data else None

def update_medical_history(user_id: str, medical_data: MedicalHistoryBase):
    data = {"user_id": user_id, **medical_data.model_dump(exclude_unset=True)}
    res = supabase_admin.table("medical_history").upsert(data).execute()
    return res.data[0]

def get_lifestyle(user_id: str):
    res = supabase_admin.table("lifestyle").select("*").eq("user_id", user_id).execute()
    return res.data[0] if res.data else None

def update_lifestyle(user_id: str, lifestyle_data: LifestyleBase):
    data = {"user_id": user_id, **lifestyle_data.model_dump(exclude_unset=True)}
    res = supabase_admin.table("lifestyle").upsert(data).execute()
    return res.data[0]
