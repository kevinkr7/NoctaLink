import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_squared_error, r2_score

# ------------------------------------------------------------------------------
# NoctaLink Cognitive Workload Training Script (OpenNeuro ds007169)
# ------------------------------------------------------------------------------
# INSTRUCTIONS FOR GOOGLE COLAB:
# 1. Upload `nback_features.csv` to Colab.
# 2. Run this script.
# 3. Download the generated `cognitive_workload_model.joblib`.
# ------------------------------------------------------------------------------

def train_cognitive_model(data_path="data/nback_features.csv", model_path="models/cognitive_workload_model.joblib"):
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Run preprocess.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Features: delta, theta, alpha, beta, gamma
    features = ['delta_power', 'theta_power', 'alpha_power', 'beta_power', 'gamma_power']
    X = df[features]
    
    # Target: workload_level (e.g. 1 to 4). We will map this to a continuous 0-100 score.
    # Level 1 = 25, Level 4 = 100
    y = df['workload_level'] * 25.0
    
    groups = df['subject_id']
    
    print(f"Loaded {len(df)} trials from {len(groups.unique())} subjects.")

    # GroupKFold ensures no subject leakage
    # If there are fewer than 5 subjects in the tiny subset, adjust n_splits
    n_splits = min(5, len(groups.unique()))
    if n_splits < 2:
        print("Not enough subjects for Cross-Validation. Training directly.")
    else:
        gkf = GroupKFold(n_splits=n_splits)
        
        r2_scores = []
        
        for train_idx, test_idx in gkf.split(X, y, groups=groups):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            reg = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
            reg.fit(X_train, y_train)
            
            y_pred = reg.predict(X_test)
            r2 = r2_score(y_test, y_pred)
            r2_scores.append(r2)
            
        print(f"\nCross-validation R^2 scores (Subject-wise): {r2_scores}")
        print(f"Mean CV R^2: {np.mean(r2_scores):.3f} ± {np.std(r2_scores):.3f}")
    
    print("\nTraining final regression model on all available data...")
    final_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    final_model.fit(X, y)
    
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(final_model, model_path)
    print(f"\nModel exported successfully to: {model_path}")

if __name__ == "__main__":
    train_cognitive_model()
