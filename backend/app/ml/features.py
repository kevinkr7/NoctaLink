from typing import Dict, Any

def extract_sleep_features(sleep_session: Dict[str, Any], eeg_data: Dict[str, float]) -> Dict[str, float]:
    """Combines sleep session info and EEG into a feature vector."""
    features = {
        'duration': sleep_session.get('duration_minutes', 0),
        'quality': sleep_session.get('quality_score', 0),
        'delta': eeg_data.get('delta_power', 0),
        'theta': eeg_data.get('theta_power', 0),
        'alpha': eeg_data.get('alpha_power', 0),
        'beta': eeg_data.get('beta_power', 0),
        'gamma': eeg_data.get('gamma_power', 0)
    }
    return features

def extract_cognitive_features(twin_state: Dict[str, float], checkin_data: Dict[str, Any]) -> Dict[str, float]:
    """Combines current twin state and daily checkin info for predictions."""
    features = {
        'sleep_debt': twin_state.get('sleep_debt', 0),
        'fatigue_score': twin_state.get('fatigue_score', 0),
        'mood': checkin_data.get('mood_score', 5),
        'stress': checkin_data.get('stress_level', 5),
        'energy': checkin_data.get('energy_level', 5)
    }
    return features

def extract_model_features(eeg_features: Dict[str, float]) -> Dict[str, float]:
    """
    Extracts and normalizes features for the Cognitive Workload / Sleep models.
    This acts as an adapter between the raw IoT EEG data and the model's expected input.
    """
    # For now, just pass through the bands
    return {
        'delta_power': eeg_features.get('delta_power', 0.0),
        'theta_power': eeg_features.get('theta_power', 0.0),
        'alpha_power': eeg_features.get('alpha_power', 0.0),
        'beta_power': eeg_features.get('beta_power', 0.0),
        'gamma_power': eeg_features.get('gamma_power', 0.0)
    }
