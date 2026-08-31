import os
import sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Navigate back to Coconut_Yield_Prediction root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def evaluate():
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    MODELS_DIR = BASE_DIR / "models"
    PROCESSED_DIR = BASE_DIR / "processed"

    model_path = MODELS_DIR / "best_model.joblib"
    scaler_path = MODELS_DIR / "scaler.joblib"
    features_path = PROCESSED_DIR / "master_features.csv"

    print("Loading models and dataset...")
    if not (model_path.exists() and scaler_path.exists() and features_path.exists()):
        print("Error: Missing required files in models/ or processed/ directories.")
        return

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    df = pd.read_csv(features_path)

    print(f"Dataset loaded with {len(df)} records.")

    # Ground truth
    if 'Avg_Nuts_Palm' not in df.columns:
        print("Error: 'Avg_Nuts_Palm' column not found in dataset. Cannot evaluate accuracy.")
        return
        
    y_true = df['Avg_Nuts_Palm'].values

    # Prepare features
    train_cols = [
        'Rainfall', 'Temperature', 'Humidity', 'Soil_Moisture_Top', 'Soil_Moisture_Root', 
        'Soil_Moisture_Diff', 'Solar_Radiation', 'Temperature_Max', 'Temperature_Min', 'Temp_Range', 
        'Rainfall_Roll_3m', 'Rainfall_Roll_6m', 'Rainfall_Roll_12m', 'Soil_Moisture_Root_Roll_3m', 
        'Soil_Moisture_Root_Roll_6m', 'Rainfall_Anomaly', 'Temp_Anomaly', 'Soil_Moisture_Anomaly', 
        'Rainfall_Lag_3m', 'Rainfall_Lag_6m', 'Rainfall_Lag_12m', 'Rainfall_Lag_24m', 
        'Soil_Moisture_Root_Lag_12m', 'Soil_Moisture_Root_Lag_24m', 'Yield_Lag_1y', 'Yield_Lag_2y', 
        'Quarter', 'Month_Sin', 'Month_Cos', 'Rain_SoilMoist_Interaction', 
        'Temp_Humidity_Interaction', 'Light_Temp_Interaction',
        'District_Hewana', 'District_Jawatta', 'District_Makandura', 'District_Maliga estate', 
        'District_Mellawa', 'District_Muruthenge', 'District_Saliya'
    ]

    # One-hot encode District
    if 'District' in df.columns:
        df_encoded = pd.get_dummies(df, columns=['District'])
    else:
        df_encoded = df.copy()

    # Create empty DataFrame with required columns
    X_df = pd.DataFrame(0, index=np.arange(len(df)), columns=train_cols)

    # Fill in values
    for col in train_cols:
        if col in df_encoded.columns:
            X_df[col] = df_encoded[col]

    # Scale numeric features
    scale_cols = list(getattr(scaler, "feature_names_in_", []))
    if not scale_cols:
        scale_cols = [c for c in train_cols if not c.startswith("District_")]

    print("Scaling features...")
    X_scaled = X_df.copy()
    X_scaled[scale_cols] = scaler.transform(X_df[scale_cols])

    print("Running predictions...")
    y_pred = model.predict(X_scaled)
    # Ensure no negative yields
    y_pred = np.maximum(0, y_pred)

    print("\n" + "="*50)
    print("  ML MODEL ACCURACY REPORT (NFR Measurement)  ")
    print("="*50)
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    avg_actual_yield = np.mean(y_true)
    mae_percentage = (mae / avg_actual_yield) * 100 if avg_actual_yield > 0 else 0

    print(f"Total Samples Evaluated : {len(y_true)}")
    print(f"Average Actual Yield    : {avg_actual_yield:.2f} nuts/palm/month\n")
    
    print(f"1. Mean Absolute Error (MAE) : {mae:.3f} nuts")
    print(f"   (Model predictions are off by an average of {mae:.2f} nuts per tree)")
    print(f"   Error Percentage          : {mae_percentage:.2f}%\n")
    
    print(f"2. Root Mean Squared Error   : {rmse:.3f} nuts")
    print(f"   (RMSE punishes large errors more heavily than MAE)\n")
    
    print(f"3. R-Squared (R²) Score      : {r2:.3f}")
    print(f"   (Model explains {r2*100:.1f}% of the variance in coconut yields)")
    print("="*50)
    
    # Save the report
    report_path = BASE_DIR / "accuracy_report.txt"
    with open(report_path, "w") as f:
        f.write("ML MODEL ACCURACY REPORT\n")
        f.write("========================\n")
        f.write(f"Total Samples : {len(y_true)}\n")
        f.write(f"MAE           : {mae:.3f}\n")
        f.write(f"RMSE          : {rmse:.3f}\n")
        f.write(f"R-Squared     : {r2:.3f}\n")
        f.write(f"Error %       : {mae_percentage:.2f}%\n")
    
    print(f"\nReport saved to: {report_path}")

if __name__ == "__main__":
    evaluate()
