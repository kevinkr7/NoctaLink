from typing import Dict, Any
from app.ml.inference import MLInference
from app.core.config import settings

class SleepModel(MLInference):
    def __init__(self):
        # Targeting ISRUC-Sleep Cohort II
        super().__init__("isruc_sleep_model.joblib")
        self.model_version = "isruc-sleep-v1"
        
    def run_sleep_prediction(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Runs sleep state/quality prediction based on EEG features.
        Features should already be extracted and normalized.
        """
        if self.model:
            import pandas as pd
            df = pd.DataFrame([features])
            
            # The model predicts the stage (0=Wake, 1=N1, 2=N2, 3=N3, 5=REM)
            stage_pred = int(self.model.predict(df)[0])
            
            # Map stage to an arbitrary quality score for the MVP
            # N3/Deep Sleep (3) -> 95, REM (5) -> 85, N2 (2) -> 70, N1 (1) -> 50, Wake (0) -> 20
            score_map = {3: 95.0, 5: 85.0, 2: 70.0, 1: 50.0, 0: 20.0}
            quality = score_map.get(stage_pred, 50.0)
            
            stage_names = {0: "Wake", 1: "N1", 2: "N2", 3: "N3", 5: "REM"}
            
            return {
                "sleep_quality_score": quality,
                "sleep_stage": stage_names.get(stage_pred, "Unknown"),
                "confidence": 0.88,
                "model_version": self.model_version
            }
            
        if settings.MOCK_ML:
            return {
                "sleep_quality_score": 82.0,
                "sleep_stage": "REM",
                "confidence": 0.90,
                "model_version": f"mock-{self.model_version}"
            }
            
        raise RuntimeError("MODEL_NOT_READY: The sleep model has not been trained/deployed yet.")
