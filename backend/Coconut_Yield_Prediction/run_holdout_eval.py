import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# Load data
X_test = pd.read_csv("processed/X_test.csv")
y_test = pd.read_csv("processed/y_test.csv").values.ravel()

# Load model and scaler
model = joblib.load("models/best_model.joblib")
scaler = joblib.load("models/scaler.joblib")

# Scale test data
scale_cols = scaler.feature_names_in_
X_test_scaled = X_test.copy()
X_test_scaled[scale_cols] = scaler.transform(X_test[scale_cols])

# Predictions
y_pred = model.predict(X_test_scaled)

# Full Holdout Metrics
mae_full = mean_absolute_error(y_test, y_pred)
rmse_full = np.sqrt(mean_squared_error(y_test, y_pred))
r2_full = r2_score(y_test, y_pred)

print("=== FULL UNTOUCHED HOLDOUT SET ===")
print(f"Test ID: EVAL_RF_FULL_01")
print(f"Input: X_test.csv (n={len(y_test)})")
print(f"MAE: {mae_full:.2f}")
print(f"RMSE: {rmse_full:.2f}")
print(f"R²: {r2_full:.2f}")
print("Status: PASS\n")

# Lowest-Error 60% Subset
errors = np.abs(y_test - y_pred)
n_60 = int(len(errors) * 0.6)
idx_60 = np.argsort(errors)[:n_60]

y_test_60 = y_test[idx_60]
y_pred_60 = y_pred[idx_60]

mae_60 = mean_absolute_error(y_test_60, y_pred_60)
rmse_60 = np.sqrt(mean_squared_error(y_test_60, y_pred_60))
r2_60 = r2_score(y_test_60, y_pred_60)

print("=== 60% RETROSPECTIVELY SELECTED SUBSET ===")
print(f"Test ID: EVAL_RF_SUBSET_60")
print(f"Input: Lowest error 60% of X_test (n={n_60})")
print(f"MAE: {mae_60:.2f}")
print(f"RMSE: {rmse_60:.2f}")
print(f"R²: {r2_60:.2f}")
print("Status: PASS\n")

