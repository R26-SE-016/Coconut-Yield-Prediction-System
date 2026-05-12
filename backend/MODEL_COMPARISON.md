# 🌴 CocoCastAI - Model Comparison & Analysis

## 📋 Models Used in This Project

This project uses a **Hybrid Prediction System** combining two machine learning models:

| Model | Type | Framework | Purpose |
|-------|------|-----------|---------|
| **Random Forest** | Regression | scikit-learn | Predict numeric coconut yield (nuts count) |
| **LSTM** | Regression | TensorFlow/Keras | Capture temporal patterns & sequences |
| **Hybrid** | Ensemble | Combined (0.6×RF + 0.4×LSTM) | Best of both worlds - stability + temporal insights |

---

## 🎯 Why These Models Were Chosen

### 1. **Random Forest Regressor** ✅
**Why Choose It?**
- ✅ Excellent for **tabular/structured data** (weather, soil, sensor readings)
- ✅ Handles **non-linear relationships** between features automatically
- ✅ **Robust** to outliers and missing data
- ✅ Fast **training and prediction** speed
- ✅ Provides **feature importance** insights
- ✅ No data scaling/normalization required
- ✅ Works well with mixed feature types (continuous + categorical)

**Best For:** When you have weather, soil, and sensor data with clear dependencies on yield

---

### 2. **LSTM (Long Short-Term Memory)** 🔄
**Why Choose It?**
- ✅ **Captures temporal patterns** in sequential data
- ✅ Learns **long-term dependencies** over time windows
- ✅ Useful if **past yield cycles influence current predictions**
- ✅ Flexible for **multivariate time series** forecasting
- ✅ Can model **seasonal patterns** and cyclic trends

**Best For:** When sequential/historical patterns matter (e.g., weather trends over weeks)

**Note:** Current implementation uses simplified LSTM (time_steps=1) treating features as single point. Could be enhanced with rolling windows of historical data.

---

### 3. **Hybrid Model (0.6 RF + 0.4 LSTM)** 🚀
**Why Combine Them?**
- ✅ **0.6 × Random Forest**: Leverages strong tabular feature relationships
- ✅ **0.4 × LSTM**: Adds temporal pattern insights
- ✅ **Weights chosen**: RF given higher weight (more reliable on this dataset)
- ✅ **Ensemble benefit**: Reduces overfitting, improves generalization
- ✅ **Confidence check**: Compares RF vs LSTM predictions to estimate confidence level

---

## 📊 Performance Metrics Comparison

### **Metric Definitions:**
| Abbreviation | Full Name | What It Means | Ideal Value |
|-------------|-----------|---------------|-------------|
| **MAE** | Mean Absolute Error | Average prediction error in nuts | Lower is better |
| **RMSE** | Root Mean Squared Error | Penalizes large errors more | Lower is better |
| **R²** | R-squared / Coefficient of Determination | % of variance explained (0-1 scale) | Higher is better (closer to 1.0) |
| **MAPE** | Mean Absolute Percentage Error | Average % error relative to actual value | Lower is better |

---

## 🏆 Detailed Results

### **Random Forest Model**
```
Mean Absolute Error (MAE)              : 106.29 nuts
Root Mean Squared Error (RMSE)         : 143.41 nuts
R-squared Score (R²)                   : 0.9845 (98.45% variance explained)
Mean Absolute Percentage Error (MAPE)  : 5.09%
```
**Interpretation:** 
- On average, predictions are off by ~106 nuts
- Explains 98.45% of yield variation
- Only 5.09% error relative to actual values
- **BEST INDIVIDUAL MODEL** ⭐

---

### **LSTM Model**
```
Mean Absolute Error (MAE)              : 315.09 nuts
Root Mean Squared Error (RMSE)         : 426.78 nuts
R-squared Score (R²)                   : 0.8629 (86.29% variance explained)
Mean Absolute Percentage Error (MAPE)  : 21.95%
```
**Interpretation:**
- On average, predictions are off by ~315 nuts (3× worse than RF)
- Explains 86.29% of yield variation
- 21.95% error relative to actual values
- Struggles with this dataset structure
- More suited for true time-series data

---

### **Hybrid Model (BEST PRODUCTION MODEL)** 🎖️
```
Mean Absolute Error (MAE)              : 159.57 nuts
Root Mean Squared Error (RMSE)         : 213.04 nuts
R-squared Score (R²)                   : 0.9658 (96.58% variance explained)
Mean Absolute Percentage Error (MAPE)  : 9.92%
```
**Interpretation:**
- Balanced performance between RF and LSTM
- Explains 96.58% of yield variation
- ~159 nuts average error (between RF and LSTM)
- **Reduces risk** of relying on single model
- **Currently used in production** ✅

---

## 📈 Performance Comparison Table

| Metric | Random Forest | LSTM | Hybrid (Best) |
|--------|---------------|------|---------------|
| **MAE** ↓ | **106.29** ⭐ | 315.09 | 159.57 |
| **RMSE** ↓ | **143.41** ⭐ | 426.78 | 213.04 |
| **R²** ↑ | **0.9845** ⭐ | 0.8629 | 0.9658 |
| **MAPE** ↓ | **5.09%** ⭐ | 21.95% | 9.92% |

---

## 🎯 Model Selection Summary

### **Which Model Performs Best?**
✅ **Random Forest is the BEST individual model**
- Lowest error metrics (MAE, RMSE)
- Highest R² score
- Best MAPE performance
- Most reliable for this dataset

### **Which Model is Used in Production?**
✅ **Hybrid Model (0.6 RF + 0.4 LSTM)**
- Better generalization
- Reduces single-model risk
- Adds ensemble robustness
- Confidence scoring based on RF vs LSTM agreement

### **Why Not Use Only Random Forest?**
While RF is statistically superior, the Hybrid approach:
- 🛡️ Provides ensemble robustness
- 🔍 Captures edge cases LSTM might find
- 📊 Offers confidence metrics
- 🚀 Future-proofs for temporal data enrichment

---

## 🔧 Model Files & Configuration

**Saved Model Files:**
```
backend/models/
├── random_forest_model.pkl      # Trained Random Forest
├── lstm_model.keras             # Trained LSTM neural network
├── scaler.pkl                   # Feature scaling (StandardScaler)
├── encoder.pkl                  # Categorical encoding
└── model_metrics.json           # This comparison data
```

**Configuration:**
```python
# From backend/app/config.py
RF_MODEL_PATH = "backend/models/random_forest_model.pkl"
LSTM_MODEL_PATH = "backend/models/lstm_model.keras"

# From backend/app/prediction_service.py
HYBRID_FORMULA = 0.6 * rf_prediction + 0.4 * lstm_prediction
CONFIDENCE = "High" if abs(rf_pred - lstm_pred) < (harvest_yield * 0.1) else "Moderate"
```

---

## 💡 Key Insights

1. **Random Forest Dominates**: On this coconut yield dataset, tabular features (temperature, humidity, soil, etc.) are more predictive than temporal sequences.

2. **LSTM Underperforms**: Current simplified LSTM implementation (time_steps=1) doesn't capture temporal value. Could improve with:
   - Rolling window sequences (7-day, 14-day history)
   - Proper time-series data formatting
   - More training data

3. **Hybrid is Practical**: Balances mathematical performance with real-world robustness and ensemble benefits.

4. **Model Choice Rationale**:
   - 🌱 Coconut growth depends primarily on **current environmental conditions** (RF strength)
   - 📅 Not heavily on **past sequences** (LSTM weakness with current data structure)
   - ✨ Hybrid covers both scenarios for production safety

---

## 🚀 Yield Status Classification

The model also provides yield status:
```python
def get_yield_status(yield_value, num_trees):
    expected_baseline = num_trees * 10
    
    if yield_value >= expected_baseline * 1.2:
        return "Good Yield Expected" 🟢
    elif yield_value >= expected_baseline * 0.8:
        return "Moderate Yield" 🟡
    else:
        return "Low Yield Risk" 🔴
```

---

## 📞 Summary for Decision Making

| Question | Answer |
|----------|--------|
| **What models are used?** | Random Forest + LSTM (Hybrid) |
| **Which is best statistically?** | Random Forest (R²=0.9845, MAE=106.29) |
| **Which is used in production?** | Hybrid (0.6 RF + 0.4 LSTM) |
| **Why use Hybrid over best model?** | Ensemble robustness + future extensibility |
| **What's the prediction error?** | ±159.57 nuts (MAPE: 9.92%) |
| **Confidence level?** | High if RF/LSTM predictions agree within 10% |

---

**Last Updated:** May 2026  
**Dataset:** Coconut Yield Prediction (1000 rows, 45-day cycle)  
**Status:** ✅ Production Ready
