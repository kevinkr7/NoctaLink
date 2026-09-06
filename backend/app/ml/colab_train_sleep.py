import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupKFold
from sklearn.metrics import classification_report, accuracy_score

# ------------------------------------------------------------------------------
# NoctaLink Sleep Model Training Script (ISRUC-Sleep-II)
# ------------------------------------------------------------------------------
# INSTRUCTIONS FOR GOOGLE COLAB:
# 1. Upload `isruc_features.csv` to Colab.
# 2. Run this script.
# 3. Download the generated `isruc_sleep_model.joblib`.
# ------------------------------------------------------------------------------

def train_sleep_model(data_path="data/isruc_features.csv", model_path="models/isruc_sleep_model.joblib"):
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Run preprocess.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Features: delta_power, theta_power, alpha_power, beta_power, gamma_power
    features = ['delta_power', 'theta_power', 'alpha_power', 'beta_power', 'gamma_power']
    X = df[features]
    y = df['stage']
    groups = df['subject_id']
    
    print(f"Loaded {len(df)} epochs from {len(groups.unique())} subjects.")

    # GroupKFold ensures that the same subject doesn't appear in both train and test sets
    n_splits = min(5, len(groups.unique()))
    if n_splits < 2:
        print("Not enough subjects for Cross-Validation. Training directly.")
    else:
        gkf = GroupKFold(n_splits=n_splits)
        
        accuracies = []
        
        # We'll keep the last split as our final test set for reporting
        for train_idx, test_idx in gkf.split(X, y, groups=groups):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
            clf.fit(X_train, y_train)
            
            y_pred = clf.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            accuracies.append(acc)
            
        print(f"\nCross-validation accuracies (Subject-wise): {accuracies}")
        print(f"Mean CV Accuracy: {np.mean(accuracies):.3f} ± {np.std(accuracies):.3f}")
    
    print("\nTraining final model on all available data for production...")
    final_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    final_model.fit(X, y)
    
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(final_model, model_path)
    print(f"\nModel exported successfully to: {model_path}")

if __name__ == "__main__":
    train_sleep_model()
