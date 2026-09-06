from app.database.supabase import supabase_admin
from app.services.cognitive_service import get_cognitive_twin
from app.schemas.prediction import RecoveryRecommendation
from datetime import datetime

def generate_recovery_recommendation(user_id: str) -> RecoveryRecommendation:
    """
    Generates a personalized recovery recommendation based on:
    - Previous sleep
    - Personal baseline
    - Current cognitive workload
    - Fatigue/recovery state
    """
    twin = get_cognitive_twin(user_id)
    
    # 1. Gather inputs
    baseline_sleep = 7.5 # Ideally fetched from user profile settings/historical baseline
    
    workload = twin.get("workload_score") or 50.0
    fatigue = twin.get("fatigue_score") or 20.0
    readiness = twin.get("cognitive_readiness") or 80.0
    
    # 2. Rule-based calculation (since there's no ML model for this specific endpoint yet)
    # Calculate recommended sleep based on deviations
    
    # If workload is high (> 70), add 0.5 hours
    # If fatigue is high (> 50), add 0.5 - 1.0 hours
    extra_sleep = 0.0
    reason_parts = []
    
    if workload > 70:
        extra_sleep += 0.5
        reason_parts.append("Higher-than-baseline cognitive workload")
        
    if fatigue > 50:
        extra_sleep += 0.75
        reason_parts.append("Elevated fatigue levels")
        
    recommended_sleep = baseline_sleep + extra_sleep
    
    reason = " and ".join(reason_parts) + "." if reason_parts else "Your cognitive workload and fatigue are within normal ranges."
    
    # Update twin state with recovery status
    recovery_state = "moderate"
    if readiness > 80:
        recovery_state = "good"
    elif readiness < 40:
        recovery_state = "poor"
        
    update_data = {
        "recovery_state": recovery_state,
        "last_updated": datetime.utcnow().isoformat()
    }
    supabase_admin.table("cognitive_twin_state").update(update_data).eq("user_id", user_id).execute()
    
    # We explicitly note this is a rule-based inference for now, so confidence is moderate
    return RecoveryRecommendation(
        recommended_sleep_hours=round(recommended_sleep, 1),
        recovery_score=round(readiness, 1),
        reason=reason,
        confidence=0.75
    )
