import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
    GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Model Paths
    MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    RF_MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
    LSTM_MODEL_PATH = os.path.join(MODELS_DIR, "lstm_model.keras")
    SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
    ENCODER_PATH = os.path.join(MODELS_DIR, "encoder.pkl")
    METRICS_PATH = os.path.join(MODELS_DIR, "model_metrics.json")

settings = Config()
