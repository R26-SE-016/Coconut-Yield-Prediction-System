import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import StandardScaler

# Constants for synthesis
AVG_SOIL_MOISTURE = 65.0
AVG_LIGHT_INTENSITY = 45000.0

def calculate_mape(y_true, y_pred):
    # Avoid division by zero
    y_true = np.where(y_true == 0, 1e-10, y_true)
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

def train():
    print("Starting Model Training Pipeline with NEW datasets...")
    
    # 1. Load Data
    datasets_dir = os.path.join("..", "datasets")
    crop_yield_path = os.path.join(datasets_dir, "crop_yield.csv")
    weather_path = os.path.join(datasets_dir, "state_weather_data_1997_2020.csv")
    
    if not os.path.exists(crop_yield_path) or not os.path.exists(weather_path):
        print("Required CSV datasets missing!")
        return

    print("Loading and Merging CSVs...")
    df_yield = pd.read_csv(crop_yield_path)
    df_weather = pd.read_csv(weather_path)
    
    # Filter for Coconut only
    df_yield = df_yield[df_yield['crop'].str.strip() == 'Coconut'].copy()
    
    # Merge on state and year
    df_yield['state'] = df_yield['state'].str.strip()
    df_yield['year'] = df_yield['year'].astype(int)
    df_weather['state'] = df_weather['state'].str.strip()
    df_weather['year'] = df_weather['year'].astype(int)
    
    df = pd.merge(df_yield, df_weather, on=['state', 'year'], how='inner')
    
    if df.empty:
        print("Merged dataset is empty! Check state/year matching.")
        return

    # 2. Focus on requested features only
    df = df.rename(columns={
        'avg_temp_c': 'temperature',
        'total_rainfall_mm': 'rainfall',
        'avg_humidity_percent': 'humidity',
        'yield': 'target_yield'
    })
    
    print("Synthesizing missing features: Soil Moisture & Light Intensity...")
    df['soil_moisture'] = df['rainfall'].apply(lambda x: min(95, max(30, 60 + (x/100) + np.random.normal(0, 5))))
    df['light_intensity'] = np.random.normal(AVG_LIGHT_INTENSITY, 5000, size=len(df))
    
    features = ['rainfall', 'temperature', 'soil_moisture', 'humidity', 'light_intensity']
    X = df[features]
    y = df['target_yield']
    
    print(f"Dataset shape: {df.shape}")
    print(f"Features: {features}")
    
    # 3. Preprocessing
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # 4. Random Forest Model
    print("Training Random Forest Regressor...")
    rf_model = RandomForestRegressor(n_estimators=150, max_depth=20, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)
    
    # 5. LSTM Model
    print("Training LSTM Model...")
    X_train_lstm = X_train.reshape((X_train.shape[0], 1, X_train.shape[1]))
    X_test_lstm = X_test.reshape((X_test.shape[0], 1, X_test.shape[1]))
    
    lstm_model = Sequential([
        LSTM(128, activation='relu', input_shape=(1, len(features)), return_sequences=True),
        Dropout(0.2),
        LSTM(64, activation='relu'),
        Dropout(0.2),
        Dense(1)
    ])
    
    lstm_model.compile(optimizer='adam', loss='mse')
    lstm_model.fit(X_train_lstm, y_train, epochs=100, batch_size=16, verbose=0)
    lstm_preds = lstm_model.predict(X_test_lstm).flatten()

    # 6. Hybrid Evaluation
    hybrid_preds = 0.6 * rf_preds + 0.4 * lstm_preds
    
    # 7. Calculate Metrics
    metrics = {
        "RandomForest": {
            "MAE": float(mean_absolute_error(y_test, rf_preds)),
            "RMSE": float(np.sqrt(mean_squared_error(y_test, rf_preds))),
            "R2": float(r2_score(y_test, rf_preds)),
            "MAPE": float(calculate_mape(y_test, rf_preds))
        },
        "LSTM": {
            "MAE": float(mean_absolute_error(y_test, lstm_preds)),
            "RMSE": float(np.sqrt(mean_squared_error(y_test, lstm_preds))),
            "R2": float(r2_score(y_test, lstm_preds)),
            "MAPE": float(calculate_mape(y_test, lstm_preds))
        },
        "Hybrid": {
            "MAE": float(mean_absolute_error(y_test, hybrid_preds)),
            "RMSE": float(np.sqrt(mean_squared_error(y_test, hybrid_preds))),
            "R2": float(r2_score(y_test, hybrid_preds)),
            "MAPE": float(calculate_mape(y_test, hybrid_preds))
        }
    }

    print("\nTraining Metrics:")
    print(json.dumps(metrics, indent=4))

    # 8. Save Models and Scaler
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)
    
    joblib.dump(rf_model, os.path.join(models_dir, "random_forest_model.pkl"))
    lstm_model.save(os.path.join(models_dir, "lstm_model.keras"))
    joblib.dump(scaler, os.path.join(models_dir, "scaler.pkl"))
    
    with open(os.path.join(models_dir, "feature_config.json"), 'w') as f:
        json.dump({"features": features}, f)
        
    with open(os.path.join(models_dir, "model_metrics.json"), 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print(f"\nModels and scaler saved to {models_dir}")

if __name__ == "__main__":
    train()
