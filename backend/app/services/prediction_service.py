from app.database.supabase import supabase_admin
from app.services.cognitive_service import get_cognitive_twin
from datetime import datetime

def make_cognitive_prediction(user_id: str):
    twin = get_cognitive_twin(user_id)
    
    # Store the prediction
    data = {
        "user_id": user_id,
        "prediction_type": "cognitive_readiness",
        "prediction_value": twin.get("cognitive_readiness", 0),
        "confidence": 0.85, # arbitrary baseline confidence
        "timestamp": datetime.utcnow().isoformat()
    }
    res = supabase_admin.table("predictions").insert(data).execute()
    return res.data[0]
