from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class PredictionInput(BaseModel):
    temperature: Optional[float] = 0
    humidity: Optional[float] = 0
    rainfall: Optional[float] = 0
    soil_moisture: Optional[float] = 0
    light_intensity: Optional[float] = 0
    # Other optional fields
    district: Optional[str] = "Kurunegala"
    year: Optional[int] = 2026
    month: Optional[str] = "May"
    number_of_trees: Optional[int] = 100

class PredictionResponse(BaseModel):
    predicted_yield_nuts: float
    harvest_cycle_days: int = 45
    yield_status: str
    confidence_level: str
    model_used: str
    timestamp: datetime
    input_data: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    firebase_connected: bool
    models_loaded: bool
