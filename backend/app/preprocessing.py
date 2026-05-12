import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

class DataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = [
            'rainfall', 'temperature', 'soil_moisture', 'humidity', 'light_intensity'
        ]
        self.categorical_cols = []
        self.numerical_cols = [
            'rainfall', 'temperature', 'soil_moisture', 'humidity', 'light_intensity'
        ]

    def clean_dataset(self, df):
        # Map dataset columns to standard names if needed
        column_mapping = {
            'avg_temp_c': 'temperature',
            'avg_humidity_percent': 'humidity',
            'total_rainfall_mm': 'rainfall',
            'soil_moisture_percent': 'soil_moisture',
            'light_intensity_lux': 'light_intensity'
        }
        df = df.rename(columns=column_mapping)
        
        # Keep only required columns + target
        required_cols = self.feature_columns + ['target_yield']
        # Filter columns that actually exist in the dataframe
        cols_to_keep = [c for c in required_cols if c in df.columns]
        df = df[cols_to_keep]
        
        # Handle missing values
        df = df.dropna()
        
        return df

    def fit_transform(self, df):
        df = self.clean_dataset(df)
        
        # Encode categorical
        for col in self.categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le
            
        # Scale numerical
        df[self.numerical_cols] = self.scaler.fit_transform(df[self.numerical_cols])
        
        return df

    def transform_input(self, input_data):
        """Transform a single input dictionary for prediction"""
        df = pd.DataFrame([input_data])
        
        # Encode categorical using saved encoders
        for col in self.categorical_cols:
            if col in self.label_encoders:
                # Handle unseen labels by mapping to a default if necessary or erroring
                # For simplicity, we assume labels are known from training
                df[col] = self.label_encoders[col].transform(df[col].astype(str))
        
        # Scale numerical
        df[self.numerical_cols] = self.scaler.transform(df[self.numerical_cols])
        
        return df[self.feature_columns]

    def save_preprocessors(self, path_scaler, path_encoder):
        joblib.dump(self.scaler, path_scaler)
        joblib.dump(self.label_encoders, path_encoder)

    def load_preprocessors(self, path_scaler, path_encoder):
        if os.path.exists(path_scaler):
            self.scaler = joblib.load(path_scaler)
        if os.path.exists(path_encoder):
            self.label_encoders = joblib.load(path_encoder)

    @staticmethod
    def create_sequences(data, target, time_steps=1):
        """Create sequences for LSTM"""
        X, y = [], []
        for i in range(len(data) - time_steps):
            X.append(data[i:(i + time_steps)])
            y.append(target[i + time_steps])
        return np.array(X), np.array(y)
