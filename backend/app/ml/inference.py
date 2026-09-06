import os
import joblib
from typing import Dict, Any
import warnings
warnings.filterwarnings("ignore")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

class MLInference:
    def __init__(self, model_filename: str):
        self.model_path = os.path.join(MODEL_DIR, model_filename)
        self.model = self._load_model()
        
    def _load_model(self):
        """Loads a scikit-learn model from the models directory."""
        if os.path.exists(self.model_path):
            return joblib.load(self.model_path)
        return None # Return None to indicate baseline fallback

    def predict(self, feature_vector: Any) -> float:
        """Makes a prediction using the loaded model."""
        if self.model:
            return float(self.model.predict(feature_vector)[0])
        raise NotImplementedError("Model not loaded and no baseline provided in inference class.")
