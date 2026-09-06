import numpy as np
from typing import Dict, Any

def validate_eeg_features(features: Dict[str, Any]) -> None:
    """Validates the incoming IoT EEG features to ensure numerical stability."""
    required_keys = ['delta_power', 'theta_power', 'alpha_power', 'beta_power', 'gamma_power']
    for key in required_keys:
        if key not in features or features[key] is None:
            raise ValueError(f"Missing required EEG feature: {key}")
        if not isinstance(features[key], (int, float)):
            raise ValueError(f"Feature {key} must be a number")
        
    if features.get('signal_quality', 1.0) < 0.0 or features.get('signal_quality', 1.0) > 1.0:
        raise ValueError("signal_quality must be between 0.0 and 1.0")

def clean_eeg_features(features: Dict[str, Any]) -> Dict[str, float]:
    """Cleans raw EEG features, handles missing values, and checks signal quality."""
    validate_eeg_features(features)
    
    if features.get('signal_quality', 0) < 0.5:
        # If signal quality is too low, return zeros to avoid polluting the model
        return {k: 0.0 for k in ['delta_power', 'theta_power', 'alpha_power', 'beta_power', 'gamma_power']}
    
    # Extract only the relevant float values
    return {
        'delta_power': float(features.get('delta_power', 0.0)),
        'theta_power': float(features.get('theta_power', 0.0)),
        'alpha_power': float(features.get('alpha_power', 0.0)),
        'beta_power': float(features.get('beta_power', 0.0)),
        'gamma_power': float(features.get('gamma_power', 0.0))
    }

def scale_features(features: Dict[str, float], scaler_type: str = "standard") -> np.ndarray:
    """
    Placeholder for scikit-learn standard scaling.
    In a real system, you would load a trained scaler from a .pkl file.
    """
    # For baseline, we just return the array
    return np.array(list(features.values())).reshape(1, -1)
