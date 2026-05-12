# 🚀 Quick Reference: Model Locations & Training Flow

## ❓ "Where Are The 2 Models?"

### 🤖 **Random Forest Model**
- **File Name**: `random_forest_model.pkl`
- **Location**: `backend/models/random_forest_model.pkl`
- **Created By**: `backend/train_model.py` (line ~45-50)
- **Framework**: scikit-learn
- **Loaded By**: `backend/app/prediction_service.py` (line ~19)
- **Configuration**: 100 estimators, max_depth=15, criterion='mse'

### 🧠 **LSTM Model**
- **File Name**: `lstm_model.keras`
- **Location**: `backend/models/lstm_model.keras`
- **Created By**: `backend/train_model.py` (line ~55-70)
- **Framework**: TensorFlow/Keras
- **Loaded By**: `backend/app/prediction_service.py` (line ~22)
- **Architecture**: LSTM(64) → Dropout(0.2) → LSTM(32) → Dropout(0.2) → Dense(1)

---

## 📊 Complete Training Flow (6 Steps)

```
STEP 1: DATA LOADING
├─ Source: datasets/coconut_yield_dataset.csv
├─ Size: 1000 rows × N features
└─ File: backend/train_model.py (line 25-30)
         │
         ↓

STEP 2: PREPROCESSING
├─ Tool: app/preprocessing.py → DataPreprocessor
├─ Actions: 
│   ├─ Fit StandardScaler on features
│   ├─ Fit Encoder on categorical columns
│   └─ Apply both to X & y
└─ Output: Normalized & encoded data
         │
         ↓

STEP 3: TRAIN-TEST SPLIT
├─ Split Ratio: 80% train (800), 20% test (200)
├─ Random State: 42 (reproducible)
└─ File: backend/train_model.py (line 37)
         │
         ↓

STEP 4A: RANDOM FOREST TRAINING
├─ File: backend/train_model.py (line 45-50)
├─ Code:
│   rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
│   rf_model.fit(X_train, y_train)
│   rf_preds = rf_model.predict(X_test)
└─ Output: 200 predictions on test data
         │
         ↓

STEP 4B: LSTM TRAINING
├─ File: backend/train_model.py (line 55-70)
├─ Code:
│   lstm_model = Sequential([
│       LSTM(64, activation='relu', return_sequences=True),
│       Dropout(0.2),
│       LSTM(32, activation='relu'),
│       Dropout(0.2),
│       Dense(1)
│   ])
│   lstm_model.fit(X_train_lstm, y_train_lstm, epochs=50)
│   lstm_preds = lstm_model.predict(X_test_lstm)
└─ Output: 200 predictions on test data
         │
         ↓

STEP 5: METRICS CALCULATION
├─ File: backend/train_model.py (line 75-95)
├─ For Each Model:
│   ├─ MAE (Mean Absolute Error)
│   ├─ RMSE (Root Mean Squared Error)
│   ├─ R² (Coefficient of Determination)
│   └─ MAPE (Mean Absolute Percentage Error)
├─ Also Calculate: Hybrid metrics (0.6×RF + 0.4×LSTM)
└─ Results Stored: In memory as Python dict
         │
         ↓

STEP 6: SAVE MODELS & ARTIFACTS
├─ File: backend/train_model.py (line 100-110)
├─ Save Locations:
│   ├─ RF Model → backend/models/random_forest_model.pkl (joblib)
│   ├─ LSTM Model → backend/models/lstm_model.keras (TensorFlow)
│   ├─ Scaler → backend/models/scaler.pkl (joblib)
│   ├─ Encoder → backend/models/encoder.pkl (joblib)
│   └─ Metrics → backend/models/model_metrics.json (JSON)
└─ ✅ Training complete!
```

---

## 🎯 How To Train Models (Run This Command)

```bash
# In terminal, navigate to backend folder
cd backend

# Install dependencies (if needed)
pip install -r requirements.txt

# Run the training script
python train_model.py
```

**Expected Output:**
```
Starting Model Training Pipeline...
Loading dataset...
Dataset shape: (1000, 9)
Preprocessing...
Training Random Forest Regressor...
Training LSTM Model...
[LSTM training progress...]

Training Metrics:
{
    "RandomForest": {
        "MAE": 106.29,
        "RMSE": 143.41,
        "R2": 0.9845,
        "MAPE": 5.09
    },
    ...
}

Models and preprocessors saved to backend/models
✅ Training complete!
```

---

## 🚀 How To Use Models (Prediction Flow)

```
USER REQUEST
    ↓
POST /predict
├─ Endpoint: backend/main.py (line ~40)
├─ Input: {temperature, humidity, soil_moisture, ...}
└─ Handler: app/prediction_service.py
    ↓
PREDICTION SERVICE INITIALIZATION
├─ On API startup: __init__() runs
├─ Loads both models:
│   ├─ RF from backend/models/random_forest_model.pkl ✅
│   ├─ LSTM from backend/models/lstm_model.keras ✅
│   ├─ Scaler from backend/models/scaler.pkl ✅
│   └─ Encoder from backend/models/encoder.pkl ✅
└─ Sets: self.models_loaded = True
    ↓
INPUT PREPROCESSING
├─ Code: processed_input = self.preprocessor.transform_input(input_data)
├─ Actions:
│   ├─ Apply scaler (normalize)
│   ├─ Apply encoder (encode categories)
│   └─ Reshape if needed
└─ Output: (1, N_features) array
    ↓
RANDOM FOREST PREDICTION
├─ Code: rf_pred = self.rf_model.predict(processed_input)[0]
└─ Output: Single numeric value (e.g., 1050)
    ↓
LSTM PREDICTION
├─ Code: lstm_input = processed_input.reshape((1, 1, N_features))
├─        lstm_pred = self.lstm_model.predict(lstm_input)[0]
└─ Output: Single numeric value (e.g., 980)
    ↓
HYBRID COMBINATION
├─ Code: hybrid_pred = 0.6 * rf_pred + 0.4 * lstm_pred
├─ Example: 0.6 × 1050 + 0.4 × 980 = 1022
└─ Output: Final prediction = 1022 nuts
    ↓
CONFIDENCE & STATUS
├─ Confidence: "High" if |RF - LSTM| < 10% of hybrid
├─ Status: "Good/Moderate/Low" based on baseline
└─ Output: Additional metadata
    ↓
FIREBASE SAVE
├─ Code: firebase_service.save_prediction(response)
└─ Stores in Realtime Database
    ↓
RETURN RESPONSE
├─ predicted_yield_nuts: 1022.0
├─ yield_status: "Moderate Yield"
├─ confidence_level: "High"
├─ model_used: "Hybrid Random Forest + LSTM"
└─ timestamp: "2026-05-11T10:30:00"
```

---

## 📁 File Structure (Key Files Only)

```
IoTImplementation/
├── backend/
│   ├── train_model.py                    ← RUN THIS TO TRAIN MODELS
│   │   (Contains both RF & LSTM training)
│   │
│   ├── main.py                           ← API SERVER (uses models)
│   │   @app.post("/predict")
│   │
│   ├── models/                           ← SAVED MODELS (OUTPUT)
│   │   ├── random_forest_model.pkl       ✅ RF Model
│   │   ├── lstm_model.keras              ✅ LSTM Model
│   │   ├── scaler.pkl                    📏 Feature Scaler
│   │   ├── encoder.pkl                   🔤 Encoder
│   │   └── model_metrics.json            📊 Metrics
│   │
│   ├── app/
│   │   ├── prediction_service.py         ← LOADS & USES MODELS
│   │   │   class PredictionService:
│   │   │   - load_models()
│   │   │   - predict(input_data)
│   │   │
│   │   ├── preprocessing.py              ← DATA PREPROCESSING
│   │   │   class DataPreprocessor
│   │   │
│   │   └── config.py                     ← MODEL PATHS
│   │       RF_MODEL_PATH = "models/random_forest_model.pkl"
│   │       LSTM_MODEL_PATH = "models/lstm_model.keras"
│   │
│   └── requirements.txt
│       (scikit-learn, tensorflow, pandas, numpy)
│
└── datasets/
    └── coconut_yield_dataset.csv         ← TRAINING DATA (INPUT)
```

---

## 🔑 Key Takeaways

| Item | Location | Purpose |
|------|----------|---------|
| **Training Code** | `backend/train_model.py` | Creates & trains both RF & LSTM models |
| **RF Model** | `backend/models/random_forest_model.pkl` | Predictions: MAE 106.29, R² 0.9845 ⭐ BEST |
| **LSTM Model** | `backend/models/lstm_model.keras` | Predictions: MAE 315.09, R² 0.8629 |
| **Hybrid Model** | Formula in `prediction_service.py` | 0.6×RF + 0.4×LSTM, R² 0.9658 (PRODUCTION) |
| **Prediction Code** | `backend/app/prediction_service.py` | Loads & uses both models to make predictions |
| **API Endpoint** | `backend/main.py` | `/predict` POST endpoint for predictions |
| **Preprocessing** | `backend/app/preprocessing.py` | Scales & encodes features for both training & inference |
| **Config** | `backend/app/config.py` | Defines all model file paths |

---

## ✅ Verification Checklist

Run these to verify everything is working:

```bash
# 1. Check if models exist
ls -la backend/models/
# Should see: random_forest_model.pkl, lstm_model.keras, scaler.pkl, encoder.pkl

# 2. Check metrics
cat backend/models/model_metrics.json
# Should show MAE, RMSE, R², MAPE for all 3 models

# 3. Run API and test /health
curl http://localhost:8000/health
# Should return: {"models_loaded": true, "firebase_connected": true/false}

# 4. Make test prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28, "humidity": 75, ...}'
# Should return prediction with hybrid_pred, confidence, yield_status
```

---

**Last Updated**: May 2026  
**Status**: ✅ Production Ready
