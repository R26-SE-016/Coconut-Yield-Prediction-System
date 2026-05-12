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

    def load_models(self):
        try:
            if os.path.exists(settings.RF_MODEL_PATH):
                self.rf_model = joblib.load(settings.RF_MODEL_PATH)
            
            if os.path.exists(settings.LSTM_MODEL_PATH):
                self.lstm_model = tf.keras.models.load_model(settings.LSTM_MODEL_PATH)
                
            self.preprocessor.load_preprocessors(settings.SCALER_PATH, settings.ENCODER_PATH)
            
            if self.rf_model and self.lstm_model:
                self.models_loaded = True
                print("Models loaded successfully.")
            else:
                print("One or more models missing.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def get_yield_status(self, yield_value, num_trees):
        if not num_trees or num_trees <= 0:
            return "Stable (Baseline)"
            
        # Average yield is about 10-15 nuts per tree for 45 days
        expected_baseline = num_trees * 10
        
        if yield_value >= expected_baseline * 1.2:
            return "Good Yield Expected"
        elif yield_value >= expected_baseline * 0.8:
            return "Moderate Yield"
        else:
            return "Low Yield Risk"

    def predict(self, input_data: dict):
        if not self.models_loaded:
            return None

        # Preprocess
        processed_input = self.preprocessor.transform_input(input_data)
        num_trees = input_data.get('number_of_trees', 100)
        if not num_trees or num_trees <= 0:
            num_trees = 100
        
        # RF Prediction
        rf_pred = self.rf_model.predict(processed_input)[0]
        
        # LSTM Prediction
        lstm_input = processed_input.values.reshape((1, 1, processed_input.shape[1]))
        lstm_pred = self.lstm_model.predict(lstm_input, verbose=0).flatten()[0]
        
        # Hybrid Prediction
        hybrid_raw = 0.6 * rf_pred + 0.4 * lstm_pred
        
        # Convert raw model output (from crop_yield.csv scales) to a per-tree multiplier
        # The CSV yield is high (~5000), so we normalize it to a realistic per-tree range (8-25)
        # We ensure the minimum is at least 10-15 nuts per tree as requested.
        per_tree_base = max(10, hybrid_raw / 450) # Heuristic to map CSV yield to per-tree yield
        
        # Final harvest yield is per_tree_base * num_trees
        harvest_yield = per_tree_base * num_trees
        
        return {
            "predicted_yield_nuts": float(round(harvest_yield, 2)),
            "harvest_cycle_days": 45,
            "yield_status": self.get_yield_status(harvest_yield, num_trees),
            "confidence_level": "High" if abs(rf_pred - lstm_pred) < (hybrid_raw * 0.2) else "Moderate",
            "model_used": "Hybrid Random Forest + LSTM"
        }

prediction_service = PredictionService()
