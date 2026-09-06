from typing import Dict, Any
from app.ml.inference import MLInference
from app.core.config import settings

class CognitiveModel(MLInference):
    def __init__(self):
        # Targeting OpenNeuro ds007169 Cognitive Workload 5-level n-back
        super().__init__("cognitive_workload_model.joblib")
        self.model_version = "cognitive-workload-v1"
        
    def run_cognitive_prediction(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs the cognitive workload prediction based on EEG features.
        Features should already be extracted and normalized via extract_model_features.
        """
        if self.model:
            import pandas as pd
            # Expected to take normalized bands and ratios
            df = pd.DataFrame([features])
            prediction = self.model.predict(df)[0]
            # Assumes prediction returns a score or level
            return {
                "workload_score": float(prediction),
                "workload_level": min(5, max(1, int(round(prediction / 25.0)))),
                "confidence": 0.85, # Should come from model probabilities
                "model_version": self.model_version
            }
            
        # If model is not ready, handle mock or return not ready
        if settings.MOCK_ML:
            # MOCK MODE: Only for development testing
            return {
                "workload_score": 64.0,
                "workload_level": 3,
                "confidence": 0.75,
                "model_version": f"mock-{self.model_version}"
            }
            
        # Model not ready
        raise RuntimeError("MODEL_NOT_READY: The cognitive workload model has not been trained/deployed yet.")
