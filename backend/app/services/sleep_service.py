from app.database.supabase import supabase_admin
from app.schemas.sleep import SleepSessionCreate
from app.schemas.eeg import EEGFeaturesCreate

def add_sleep_session(user_id: str, session: SleepSessionCreate):
    data = {
        "user_id": user_id,
        "start_time": session.start_time.isoformat(),
        "end_time": session.end_time.isoformat(),
        "duration_minutes": session.duration_minutes,
        "quality_score": session.quality_score
    }
    res = supabase_admin.table("sleep_sessions").insert(data).execute()
    
    # We should update the cognitive twin based on this new sleep session here or asynchronously.
    # We'll handle this in the cognitive service.
    
    return res.data[0] if res.data else None

def get_latest_sleep(user_id: str):
    res = supabase_admin.table("sleep_sessions").select("*").eq("user_id", user_id).order("start_time", desc=True).limit(1).execute()
    return res.data[0] if res.data else None

def get_sleep_history(user_id: str):
    res = supabase_admin.table("sleep_sessions").select("*").eq("user_id", user_id).order("start_time", desc=True).limit(30).execute()
    return res.data

def add_eeg_features(user_id: str, features: EEGFeaturesCreate):
    data = {
        "user_id": user_id,
        "session_id": features.session_id,
        "delta_power": features.delta_power,
        "theta_power": features.theta_power,
        "alpha_power": features.alpha_power,
        "beta_power": features.beta_power,
        "gamma_power": features.gamma_power,
        "signal_quality": features.signal_quality
    }
    res = supabase_admin.table("eeg_features").insert(data).execute()
    return res.data[0] if res.data else None
