# 🌴 CocoCastAI - Model Training & Prediction Flow

## 📁 Where Are The Models Located?

```
backend/
├── train_model.py                          ← TRAINING SCRIPT
│   ├── Loads data from datasets/
│   ├── Preprocesses with DataPreprocessor
│   ├── Trains RandomForestRegressor
│   ├── Trains LSTM Sequential model
│   └── Saves models to backend/models/
│
├── models/ (SAVED MODELS)                  ← MODEL FILES
│   ├── random_forest_model.pkl             🤖 Random Forest (scikit-learn)
│   ├── lstm_model.keras                    🧠 LSTM Neural Network
│   ├── scaler.pkl                          📏 Feature Scaler
│   ├── encoder.pkl                         🔤 Categorical Encoder
│   └── model_metrics.json                  📊 Performance Metrics
│
├── app/
│   ├── prediction_service.py               ← PREDICTION SERVICE
│   │   ├── Loads both saved models
│   │   ├── Loads preprocessors
│   │   └── Makes hybrid predictions (0.6 RF + 0.4 LSTM)
│   │
│   ├── preprocessing.py                    ← DATA PREPROCESSING
│   │   ├── DataPreprocessor class
│   │   ├── Feature scaling (StandardScaler)
│   │   └── Categorical encoding
│   │
│   ├── config.py                           ← CONFIGURATION
│   │   └── All model paths defined
│   │
│   └── firebase_service.py                 ← DATABASE
│       ├── Saves predictions
│       └── Retrieves sensor data
│
├── main.py                                  ← API ENDPOINTS
│   ├── /predict - Makes predictions
│   ├── /health - Check models loaded
│   └── /prediction-history - Retrieves results
│
└── requirements.txt                         ← DEPENDENCIES

datasets/
└── coconut_yield_dataset.csv               ← TRAINING DATA
```

---

## 🔄 Complete Model Training Process Flow

### **PHASE 1: DATA PREPARATION**

```
┌─────────────────────────────────────────────────────────────────┐
│                    📊 TRAINING DATA LOADING                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                   datasets/coconut_yield_dataset.csv
                   (1000 rows × N features)
                              ↓
                   Features: temperature, humidity, 
                   soil_moisture, light_intensity,
                   rainfall, number_of_trees, etc.
                              ↓
                   Target: yield_nuts (numeric)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   🔧 DATA PREPROCESSING                          │
│         (app/preprocessing.py - DataPreprocessor class)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
          Feature Scaling          Categorical Encoding
          (StandardScaler)         (LabelEncoder)
                    ↓                   ↓
          Normalized features     Encoded categories
                    └─────────┬─────────┘
                              ↓
                    Preprocessed Dataset
                    ✅ Ready for modeling
```

---

### **PHASE 2: TRAIN-TEST SPLIT**

```
┌─────────────────────────────────────────────────────────────────┐
│              🔀 TRAIN-TEST SPLIT (80-20)                        │
│         test_size=0.2, random_state=42                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            X_train (800 rows)    X_test (200 rows)
            y_train (800 targets) y_test (200 targets)
                    ↓                   ↓
              Used for training     Used for evaluation
```

---

### **PHASE 3: MODEL TRAINING (PARALLEL)**

```
┌──────────────────────────────────────────────────────────────────────┐
│                    🚀 DUAL MODEL TRAINING                           │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        ┌─────────────────────┐  ┌──────────────────────┐
        │  MODEL 1: RANDOM    │  │   MODEL 2: LSTM      │
        │  FOREST             │  │   NEURAL NETWORK     │
        └─────────────────────┘  └──────────────────────┘
                    ↓                   ↓
        Input: X_train (800×N)    Input: X_train_lstm
        Hyperparameters:          (800×1×N reshaped)
        - n_estimators=100        ↓
        - max_depth=15       Sequential Model:
        - criterion='mse'    ├─ LSTM(64 units, 
        ↓                    │  activation='relu',
        RandomForestRegressor    │  return_sequences=True)
        trained on 800 rows  ├─ Dropout(0.2)
                             ├─ LSTM(32 units,
                             │  activation='relu')
                             ├─ Dropout(0.2)
                             └─ Dense(1)
                             Compile: optimizer='adam',
                                      loss='mse'
                             ↓
                             Fit: epochs=50,
                                  batch_size=32
```

---

### **PHASE 4: PREDICTIONS ON TEST SET**

```
┌──────────────────────────────────────────────────────────────────────┐
│                 🎯 TEST SET PREDICTIONS                              │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        RF_preds = rf_model.predict   LSTM_preds = lstm_model.predict
        (X_test)                       (X_test_lstm)
        ↓                              ↓
        [predictions on 200 samples]   [predictions on 200 samples]
        
        Example: [950, 1200, 850...]   [1100, 1050, 900...]
                 (nuts/harvest)        (nuts/harvest)
```

---

### **PHASE 5: METRICS CALCULATION**

```
┌──────────────────────────────────────────────────────────────────────┐
│          📊 PERFORMANCE EVALUATION ON TEST SET                       │
│              (sklearn.metrics module)                                │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        Actual y_test (200 samples)  ← Compared with
                    ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    Model 1:      Model 2:     Model 3:
    RF Metrics    LSTM Metrics Hybrid Metrics
    ├─ MAE        ├─ MAE       ├─ MAE
    ├─ RMSE       ├─ RMSE      ├─ RMSE
    ├─ R²         ├─ R²        ├─ R²
    └─ MAPE       └─ MAPE      └─ MAPE

Results stored in: backend/models/model_metrics.json
```

---

### **PHASE 6: MODEL PERSISTENCE**

```
┌──────────────────────────────────────────────────────────────────────┐
│             💾 SAVE TRAINED MODELS & ARTIFACTS                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────┬───────────┬───────────┬────────────┐
        ↓           ↓           ↓           ↓            ↓
    RF Model    LSTM Model  Scaler      Encoder     Metrics
    (joblib)    (.keras)    (joblib)    (joblib)    (JSON)
        ↓           ↓           ↓           ↓            ↓
    .pkl        .keras      .pkl        .pkl        .json
        ↓           ↓           ↓           ↓            ↓
    backend/models/random_forest_model.pkl
    backend/models/lstm_model.keras
    backend/models/scaler.pkl
    backend/models/encoder.pkl
    backend/models/model_metrics.json
```

---

## 🔄 INFERENCE FLOW (Making Predictions)

### **When User Makes a Prediction Request**

```
┌──────────────────────────────────────────────────────────────────────┐
│            🌐 USER REQUEST: /predict (POST)                          │
│                                                                      │
│  Input Data:                                                         │
│  {                                                                   │
│    "temperature": 28.5,                                             │
│    "humidity": 75,                                                  │
│    "soil_moisture": 60,                                             │
│    "light_intensity_lux": 800,                                      │
│    "number_of_trees": 100                                           │
│  }                                                                   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│          📥 LOAD MODELS & PREPROCESSORS (if not cached)             │
│                 (prediction_service.py)                             │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌───────────────────────────────────────┐
        ├─ Load random_forest_model.pkl         │
        ├─ Load lstm_model.keras                │
        ├─ Load scaler.pkl                      │
        └─ Load encoder.pkl                     │
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│        🔧 PREPROCESS INPUT                                           │
│        (Apply same scaler & encoder as training)                    │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
        processed_input = scaler.transform(input_data)
                              ↓
        Shape: (1, N_features)
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│          🤖 MAKE PREDICTIONS WITH BOTH MODELS                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        ↓                                     ↓
    RF_prediction              LSTM_prediction
    rf_model.predict()         lstm_model.predict()
    (processed_input)          (reshaped input)
        ↓                           ↓
    e.g., 1050 nuts            e.g., 980 nuts
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│          🎯 HYBRID PREDICTION (0.6 RF + 0.4 LSTM)                   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
    hybrid_pred = 0.6 * 1050 + 0.4 * 980
                = 630 + 392
                = 1022 nuts (predicted yield)
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│        📈 CONFIDENCE SCORING                                         │
│        (Check agreement between RF and LSTM)                        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
    difference = |1050 - 980| = 70 nuts
    threshold = 1022 * 0.1 = 102.2 nuts
    
    if difference < threshold:
        confidence = "High" ✅
    else:
        confidence = "Moderate" ⚠️
                              ↓
                    confidence = "High"
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│        🟢 YIELD STATUS CLASSIFICATION                               │
│        (Using get_yield_status function)                            │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
    expected_baseline = 100 trees * 10 = 1000 nuts
    
    if 1022 >= 1000 * 1.2 (1200):  → "Good Yield Expected" 🟢
    elif 1022 >= 1000 * 0.8 (800):  → "Moderate Yield" 🟡
    else:                             → "Low Yield Risk" 🔴
                              ↓
                    "Moderate Yield" 🟡
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│          📤 FINAL RESPONSE TO USER                                   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
    {
      "predicted_yield_nuts": 1022.0,
      "harvest_cycle_days": 45,
      "yield_status": "Moderate Yield",
      "confidence_level": "High",
      "model_used": "Hybrid Random Forest + LSTM",
      "timestamp": "2026-05-11T10:30:00",
      "input_data": { ... }
    }
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│        💾 SAVE TO FIREBASE (prediction history)                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Training Script Breakdown

### **train_model.py - Detailed Steps**

```python
# ============ STEP 1: LOAD DATA ============
dataset_path = "datasets/coconut_yield_dataset.csv"
df = pd.read_csv(dataset_path)  # 1000 rows

# ============ STEP 2: PREPROCESS ============
preprocessor = DataPreprocessor()
df_processed = preprocessor.fit_transform(df)
X = df_processed[feature_columns].values      # Features (1000 × N)
y = df_processed['yield_nuts'].values         # Target (1000,)

# ============ STEP 3: SPLIT DATA ============
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
# X_train: 800 samples, X_test: 200 samples

# ============ STEP 4A: TRAIN RANDOM FOREST ============
rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)
rf_preds = rf_model.predict(X_test)

# ============ STEP 4B: TRAIN LSTM ============
X_lstm = X.reshape((X.shape[0], 1, X.shape[1]))  # Add time dimension
X_train_lstm, X_test_lstm, _, _ = train_test_split(
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
lstm_model.fit(X_train_lstm, y_train, epochs=50, batch_size=32, verbose=0)
lstm_preds = lstm_model.predict(X_test_lstm).flatten()

# ============ STEP 5: CALCULATE METRICS ============
metrics = {
    "RandomForest": {
        "MAE": mean_absolute_error(y_test, rf_preds),
        "RMSE": sqrt(mean_squared_error(y_test, rf_preds)),
        "R2": r2_score(y_test, rf_preds),
        "MAPE": calculate_mape(y_test, rf_preds)
    },
    "LSTM": { ... },
    "Hybrid": {
        "MAE": mean_absolute_error(y_test, hybrid_preds),
        ...
    }
}

# ============ STEP 6: SAVE MODELS ============
joblib.dump(rf_model, 'backend/models/random_forest_model.pkl')
lstm_model.save('backend/models/lstm_model.keras')
preprocessor.save_preprocessors('backend/models/scaler.pkl', 
                                 'backend/models/encoder.pkl')

with open('backend/models/model_metrics.json', 'w') as f:
    json.dump(metrics, f)
```

---

## 🔗 File Dependencies & Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   datasets/                                      │
│            coconut_yield_dataset.csv                            │
│            (1000 rows, training data)                           │
└────────────────────┬─────────────────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────────────────┐
│  app/preprocessing.py                                          │
│  DataPreprocessor class                                        │
│  ├─ fit_transform() - Learn scaler & encoder                  │
│  └─ transform_input() - Apply preprocessing                   │
└────────────┬───────────────────────┬──────────────────────────┘
             ↓                       ↓
    ┌────────────────────┐  ┌───────────────────┐
    │  train_model.py    │  │ prediction_        │
    │                    │  │ service.py        │
    │  ├─ Trains RF      │  │                   │
    │  ├─ Trains LSTM    │  │ ├─ Loads models  │
    │  ├─ Evaluates      │  │ ├─ Preprocesses  │
    │  └─ Saves models   │  │ └─ Predicts      │
    └────────────┬───────┘  └────────┬──────────┘
                 ↓                   ↓
    ┌────────────────────────────────────────────┐
    │    backend/models/                         │
    │    ├─ random_forest_model.pkl             │
    │    ├─ lstm_model.keras                    │
    │    ├─ scaler.pkl                          │
    │    ├─ encoder.pkl                         │
    │    └─ model_metrics.json                  │
    └────────────┬─────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │    app/config.py                           │
    │    (defines all paths)                     │
    └────────────┬─────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │    main.py (FastAPI)                       │
    │    ├─ /predict endpoint                    │
    │    ├─ /health endpoint                     │
    │    └─ /prediction-history endpoint         │
    └────────────┬─────────────────────────────┘
                 ↓
    ┌────────────────────────────────────────────┐
    │    firebase_service.py                     │
    │    (saves to Firebase Realtime Database)   │
    └────────────────────────────────────────────┘
```

---

## 🎯 Summary

**Where Are Models?**
- ✅ `backend/models/random_forest_model.pkl` - Random Forest
- ✅ `backend/models/lstm_model.keras` - LSTM Network
- ✅ Both trained in `backend/train_model.py`

**Training Flow:**
1. Load data → 2. Preprocess → 3. Split 80/20 → 4. Train both models in parallel → 5. Evaluate metrics → 6. Save to backend/models/

**Prediction Flow:**
1. Load saved models → 2. Preprocess input → 3. RF prediction + LSTM prediction → 4. Hybrid combination (0.6 RF + 0.4 LSTM) → 5. Confidence scoring → 6. Yield status classification → 7. Return result

**Key Files:**
- Training: `backend/train_model.py`
- Inference: `backend/app/prediction_service.py`
- Config: `backend/app/config.py`
- API: `backend/main.py`
