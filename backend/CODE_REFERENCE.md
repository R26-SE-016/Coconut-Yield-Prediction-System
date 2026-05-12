# 🔧 Model Training & Prediction - Code Reference

## 📍 LOCATION 1: Where Models Are Trained

### File: `backend/train_model.py`

```python
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# ========== STEP 1: LOAD DATA ==========
df = pd.read_csv("../datasets/coconut_yield_dataset.csv")
print(f"Dataset shape: {df.shape}")  # (1000, N_features)

# ========== STEP 2: PREPROCESS ==========
preprocessor = DataPreprocessor()
df_processed = preprocessor.fit_transform(df)
X = df_processed[preprocessor.feature_columns].values
y = df_processed['yield_nuts'].values

# ========== STEP 3: SPLIT DATA ==========
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
# 800 training samples, 200 test samples

# ========== STEP 4A: TRAIN RANDOM FOREST ==========
print("Training Random Forest Regressor...")
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_preds = rf_model.predict(X_test)

# ========== STEP 4B: TRAIN LSTM ==========
print("Training LSTM Model...")
X_lstm = X.reshape((X.shape[0], 1, X.shape[1]))  # (1000, 1, N_features)
X_train_lstm, X_test_lstm, y_train_lstm, y_test_lstm = train_test_split(
    X_lstm, y, test_size=0.2, random_state=42
)

lstm_model = Sequential([
    LSTM(64, activation='relu', input_shape=(1, X.shape[1]), return_sequences=True),
    Dropout(0.2),
    LSTM(32, activation='relu'),
    Dropout(0.2),
    Dense(1)
])

lstm_model.compile(optimizer='adam', loss='mse')
lstm_model.fit(X_train_lstm, y_train_lstm, epochs=50, batch_size=32, verbose=0)
lstm_preds = lstm_model.predict(X_test_lstm).flatten()

# ========== STEP 5: CALCULATE METRICS ==========
metrics = {
    "RandomForest": {
        "MAE": mean_absolute_error(y_test, rf_preds),        # 106.29
        "RMSE": np.sqrt(mean_squared_error(y_test, rf_preds)), # 143.41
        "R2": r2_score(y_test, rf_preds),                    # 0.9845
        "MAPE": calculate_mape(y_test, rf_preds)             # 5.09%
    },
    "LSTM": {
        "MAE": mean_absolute_error(y_test, lstm_preds),      # 315.09
        "RMSE": np.sqrt(mean_squared_error(y_test, lstm_preds)), # 426.78
        "R2": r2_score(y_test, lstm_preds),                  # 0.8629
        "MAPE": calculate_mape(y_test, lstm_preds)           # 21.95%
    },
    "Hybrid": {
        "MAE": mean_absolute_error(y_test, hybrid_preds),    # 159.57
        "RMSE": np.sqrt(mean_squared_error(y_test, hybrid_preds)), # 213.04
        "R2": r2_score(y_test, hybrid_preds),                # 0.9658
        "MAPE": calculate_mape(y_test, hybrid_preds)         # 9.92%
    }
}

# ========== STEP 6: SAVE MODELS ==========
os.makedirs(settings.MODELS_DIR, exist_ok=True)
joblib.dump(rf_model, settings.RF_MODEL_PATH)              # ✅ Saves to backend/models/random_forest_model.pkl
lstm_model.save(settings.LSTM_MODEL_PATH)                  # ✅ Saves to backend/models/lstm_model.keras
preprocessor.save_preprocessors(settings.SCALER_PATH, settings.ENCODER_PATH)  # ✅ Saves preprocessors
json.dump(metrics, open(settings.METRICS_PATH, 'w'))       # ✅ Saves metrics
```

---

## 📍 LOCATION 2: Where Models Are Loaded & Used

### File: `backend/app/prediction_service.py`

```python
import joblib
import os
import numpy as np
import tensorflow as tf
from app.config import settings
from app.preprocessing import DataPreprocessor

class PredictionService:
    def __init__(self):
        self.rf_model = None
        self.lstm_model = None
        self.preprocessor = DataPreprocessor()
        self.models_loaded = False
        self.load_models()

    # ========== LOAD SAVED MODELS ==========
    def load_models(self):
        try:
            # Load Random Forest
            if os.path.exists(settings.RF_MODEL_PATH):
                self.rf_model = joblib.load(settings.RF_MODEL_PATH)
                print(f"✅ Loaded RF from {settings.RF_MODEL_PATH}")
            
            # Load LSTM
            if os.path.exists(settings.LSTM_MODEL_PATH):
                self.lstm_model = tf.keras.models.load_model(settings.LSTM_MODEL_PATH)
                print(f"✅ Loaded LSTM from {settings.LSTM_MODEL_PATH}")
                
            # Load preprocessors (scaler & encoder)
            self.preprocessor.load_preprocessors(
                settings.SCALER_PATH, 
                settings.ENCODER_PATH
            )
            
            if self.rf_model and self.lstm_model:
                self.models_loaded = True
                print("✅ All models loaded successfully!")
            else:
                print("❌ One or more models missing")
        except Exception as e:
            print(f"❌ Error loading models: {e}")

    # ========== MAKE PREDICTIONS ==========
    def predict(self, input_data: dict):
        """
        Expected input_data:
        {
            "temperature": 28.5,
            "humidity": 75.0,
            "soil_moisture": 60.0,
            "light_intensity_lux": 800.0,
            "number_of_trees": 100
        }
        """
        if not self.models_loaded:
            return None

        # Step 1: Preprocess input using saved scaler & encoder
        processed_input = self.preprocessor.transform_input(input_data)
        # Shape: (1, N_features) - normalized & encoded

        # Step 2: Random Forest Prediction
        rf_pred = self.rf_model.predict(processed_input)[0]
        print(f"RF Prediction: {rf_pred:.2f} nuts")

        # Step 3: LSTM Prediction
        lstm_input = processed_input.values.reshape((1, 1, processed_input.shape[1]))
        # Reshape to (1, 1, N_features) for LSTM
        lstm_pred = self.lstm_model.predict(lstm_input, verbose=0).flatten()[0]
        print(f"LSTM Prediction: {lstm_pred:.2f} nuts")

        # Step 4: Hybrid Prediction (0.6 RF + 0.4 LSTM)
        hybrid_pred = 0.6 * rf_pred + 0.4 * lstm_pred
        print(f"Hybrid Prediction: {hybrid_pred:.2f} nuts")
        harvest_yield = hybrid_pred

        # Step 5: Confidence Scoring (RF vs LSTM agreement)
        difference = abs(rf_pred - lstm_pred)
        threshold = harvest_yield * 0.1  # ±10% of predicted yield
        
        if difference < threshold:
            confidence = "High"
        else:
            confidence = "Moderate"

        # Step 6: Yield Status Classification
        yield_status = self.get_yield_status(harvest_yield, input_data.get('number_of_trees', 100))

        # ========== RETURN RESPONSE ==========
        return {
            "predicted_yield_nuts": float(round(harvest_yield, 2)),
            "harvest_cycle_days": 45,
            "yield_status": yield_status,              # "Good Yield" / "Moderate" / "Low Risk"
            "confidence_level": confidence,             # "High" / "Moderate"
            "model_used": "Hybrid Random Forest + LSTM",
            "rf_prediction": float(round(rf_pred, 2)),
            "lstm_prediction": float(round(lstm_pred, 2)),
        }

    def get_yield_status(self, yield_value, num_trees):
        """Classify yield status based on expected baseline"""
        expected_baseline = num_trees * 10
        
        if yield_value >= expected_baseline * 1.2:
            return "Good Yield Expected 🟢"
        elif yield_value >= expected_baseline * 0.8:
            return "Moderate Yield 🟡"
        else:
            return "Low Yield Risk 🔴"

# Global instance
prediction_service = PredictionService()
```

---

## 📍 LOCATION 3: Where Model Paths Are Configured

### File: `backend/app/config.py`

```python
import os
from dotenv import load_dotenv

class Config:
    FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # ========== MODEL PATHS ==========
    MODELS_DIR = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "models"
    )  # Points to backend/models/
    
    # Random Forest Model
    RF_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
    # → backend/models/random_forest_model.pkl
    
    # LSTM Model
    LSTM_MODEL_PATH = os.path.join(MODELS_DIR, "lstm_model.keras")
    # → backend/models/lstm_model.keras
    
    # Preprocessing artifacts
    SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
    # → backend/models/scaler.pkl
    
    ENCODER_PATH = os.path.join(MODELS_DIR, "encoder.pkl")
    # → backend/models/encoder.pkl
    
    # Metrics
    METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")
    # → backend/models/model_metrics.json

settings = Config()
```

---

## 📍 LOCATION 4: Where Predictions Are Made (API)

### File: `backend/main.py`

```python
from fastapi import FastAPI
from app.prediction_service import prediction_service
from app.schemas import PredictionInput, PredictionResponse

app = FastAPI(title="Coconut Yield Prediction API")

# ========== HEALTH CHECK ENDPOINT ==========
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": prediction_service.models_loaded,  # ✅ Shows if both models are loaded
        "timestamp": datetime.now()
    }

# ========== PREDICTION ENDPOINT ==========
@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionInput):
    """
    Accepts input data and returns yield prediction
    
    Example Request:
    {
        "temperature": 28.5,
        "humidity": 75.0,
        "soil_moisture": 60.0,
        "light_intensity_lux": 800.0,
        "number_of_trees": 100,
        "rainfall": 150.0,
        "nitrogen": 45.0,
        "phosphorus": 15.0,
        "potassium": 40.0
    }
    """
    
    if not prediction_service.models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    input_dict = data.dict()
    
    # Get prediction from both models
    result = prediction_service.predict(input_dict)
    
    # Wrap with timestamp and save to Firebase
    response = {
        **result,
        "timestamp": datetime.now(),
        "input_data": input_dict
    }
    
    firebase_service.save_prediction(response)
    
    return response

# ========== EXAMPLE RESPONSE ==========
"""
{
    "predicted_yield_nuts": 1022.0,
    "harvest_cycle_days": 45,
    "yield_status": "Moderate Yield 🟡",
    "confidence_level": "High",
    "model_used": "Hybrid Random Forest + LSTM",
    "rf_prediction": 1050.0,
    "lstm_prediction": 980.0,
    "timestamp": "2026-05-11T10:30:00",
    "input_data": { ... }
}
"""
```

---

## 🔄 Complete Data Flow Sequence

```
1. USER PROVIDES INPUT
   ↓
   {temperature: 28.5, humidity: 75, ...}

2. FastAPI RECEIVES /predict REQUEST
   ↓
   app/main.py → @app.post("/predict")

3. PREDICTION SERVICE IS CALLED
   ↓
   prediction_service.predict(input_data)

4. INPUT IS PREPROCESSED
   ↓
   Uses saved scaler.pkl & encoder.pkl
   Normalizes & encodes features

5. RANDOM FOREST PREDICTS
   ↓
   rf_model.predict(preprocessed_input)
   → e.g., 1050 nuts

6. LSTM PREDICTS
   ↓
   lstm_model.predict(reshaped_input)
   → e.g., 980 nuts

7. HYBRID COMBINATION
   ↓
   0.6 × 1050 + 0.4 × 980 = 1022 nuts

8. CONFIDENCE SCORING
   ↓
   Check: |1050 - 980| < (1022 × 0.1)?
   → Yes → "High" confidence

9. YIELD STATUS CLASSIFICATION
   ↓
   Compare with baseline (100 trees × 10 = 1000 nuts)
   → 1022 ≥ 800 & < 1200 → "Moderate Yield"

10. SAVE TO FIREBASE
    ↓
    firebase_service.save_prediction(response)

11. RETURN RESPONSE TO USER
    ↓
    {
        "predicted_yield_nuts": 1022.0,
        "yield_status": "Moderate Yield 🟡",
        "confidence_level": "High",
        ...
    }
```

---

## 📊 Model Files Summary

| File | Location | Purpose | Size |
|------|----------|---------|------|
| `random_forest_model.pkl` | `backend/models/` | Trained Random Forest (100 estimators) | ~1-2 MB |
| `lstm_model.keras` | `backend/models/` | Trained LSTM Sequential model | ~500 KB |
| `scaler.pkl` | `backend/models/` | StandardScaler (for normalization) | ~1 KB |
| `encoder.pkl` | `backend/models/` | LabelEncoder (for categorical vars) | ~1 KB |
| `model_metrics.json` | `backend/models/` | Performance metrics (MAE, RMSE, R², MAPE) | ~1 KB |

---

## 🎯 Quick Checklist: Full Training Cycle

- [x] **Data Loading**: `datasets/coconut_yield_dataset.csv` (1000 rows)
- [x] **Preprocessing**: StandardScaler + Encoder applied
- [x] **Train-Test Split**: 80-20 split (800 training, 200 testing)
- [x] **Random Forest Training**: `train_model.py` creates & trains
- [x] **LSTM Training**: Sequential model with 2 LSTM layers
- [x] **Model Evaluation**: MAE, RMSE, R², MAPE calculated on test set
- [x] **Model Persistence**: Both models saved to `backend/models/`
- [x] **Preprocessor Saving**: Scaler & encoder saved for inference
- [x] **API Integration**: `prediction_service.py` loads models on startup
- [x] **Prediction Endpoint**: `/predict` combines RF + LSTM (0.6 + 0.4)
- [x] **Firebase Storage**: Predictions saved to Realtime Database
