from app.database.supabase import supabase_admin
from app.ml.cognitive_model import CognitiveModel
from app.ml.sleep_model import SleepModel
from app.ml.features import extract_cognitive_features, extract_sleep_features, extract_model_features
from app.ml.preprocessing import clean_eeg_features
from app.schemas.iot import IoTEEGPayload
from datetime import datetime
import json

cognitive_model = CognitiveModel()
sleep_model = SleepModel()

def get_cognitive_twin(user_id: str):
    res = supabase_admin.table("cognitive_twin_state").select("*").eq("user_id", user_id).execute()
    if not res.data:
        # Initialize default
        data = {"user_id": user_id, "last_updated": datetime.utcnow().isoformat()}
        res = supabase_admin.table("cognitive_twin_state").insert(data).execute()
        return res.data[0]
    return res.data[0]

def update_from_checkin(user_id: str, checkin_data: dict):
    # Backward compatibility stub
    pass

def update_from_sleep(user_id: str, sleep_data: dict, eeg_data: dict = None):
    # Backward compatibility stub
    pass

def process_iot_eeg_payload(user_id: str, payload: IoTEEGPayload) -> dict:
    """
    Core pipeline:
    1. Validate/Clean IoT payload
    2. Save EEG features
    3. Run Model
    4. Save Predictions
    5. Update Twin State
    """
    
    # 1. Clean features
    cleaned_eeg = clean_eeg_features(payload.eeg.model_dump() | {'signal_quality': payload.signal_quality})
    
    # 2. Save EEG to DB
    eeg_db_data = {
        "user_id": user_id,
        "device_id": payload.device_id,
        "timestamp": payload.timestamp.isoformat(),
        "session_type": payload.session_type,
        "signal_quality": payload.signal_quality,
        "delta_power": cleaned_eeg.get("delta_power"),
        "theta_power": cleaned_eeg.get("theta_power"),
        "alpha_power": cleaned_eeg.get("alpha_power"),
        "beta_power": cleaned_eeg.get("beta_power"),
        "gamma_power": cleaned_eeg.get("gamma_power"),
        "relative_delta": payload.eeg.relative_delta,
        "relative_theta": payload.eeg.relative_theta,
        "relative_alpha": payload.eeg.relative_alpha,
        "relative_beta": payload.eeg.relative_beta,
        "relative_gamma": payload.eeg.relative_gamma,
        "theta_alpha_ratio": payload.eeg.theta_alpha_ratio,
        "beta_alpha_ratio": payload.eeg.beta_alpha_ratio
    }
    
    eeg_res = supabase_admin.table("eeg_features").insert(eeg_db_data).execute()
    eeg_id = eeg_res.data[0]['id'] if eeg_res.data else None
    
    # 3. Model Inference
    model_features = extract_model_features(cleaned_eeg)
    cognitive_pred = cognitive_model.run_cognitive_prediction(model_features)
    
    # 4. Save Prediction
    pred_db_data = {
        "user_id": user_id,
        "prediction_type": "cognitive_workload",
        "prediction_value": cognitive_pred["workload_score"],
        "confidence": cognitive_pred["confidence"],
        "model_version": cognitive_pred["model_version"],
        "input_snapshot": json.dumps(model_features)
    }
    supabase_admin.table("predictions").insert(pred_db_data).execute()
    
    # 5. Update Twin State
    twin = get_cognitive_twin(user_id)
    
    # Simple arbitrary update logic for twin based on workload for demonstration
    workload = cognitive_pred["workload_score"]
    readiness = twin.get("cognitive_readiness") or 100
    fatigue = twin.get("fatigue_score") or 0
    
    # Adjust state based on new workload (simple mock logic)
    new_fatigue = min(100, fatigue + (workload * 0.1))
    new_readiness = max(0, 100 - new_fatigue)
    
    twin_update_data = {
        "workload_score": workload,
        "cognitive_readiness": new_readiness,
        "fatigue_score": new_fatigue,
        "confidence": cognitive_pred["confidence"],
        "model_version": cognitive_pred["model_version"],
        "last_updated": datetime.utcnow().isoformat()
    }
    supabase_admin.table("cognitive_twin_state").update(twin_update_data).eq("user_id", user_id).execute()
    
    return {"id": eeg_id, "state": twin_update_data}
