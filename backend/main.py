from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List

from app.schemas import PredictionInput, PredictionResponse, HealthResponse
from app.firebase_service import firebase_service
from app.prediction_service import prediction_service
from app.config import settings

app = FastAPI(title="Coconut Yield Prediction API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# check backend properly working
@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "healthy",
        "firebase_connected": firebase_service.db is not None,
        "models_loaded": prediction_service.models_loaded
    }


# Prediction Endpoint
@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionInput):
    if not prediction_service.models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    # read latest sensor data 
    latest_sensors = firebase_service.get_latest_sensor_data()
    
    input_dict = data.dict()
    
    # Merge latest sensors into input if values are 0 or default (optional logic)
    # Or simply prioritize real-time sensor data if available
    if latest_sensors:
        if not input_dict.get("temperature"): input_dict["temperature"] = latest_sensors.get("temperatureC", 28.0)
        if not input_dict.get("humidity"): input_dict["humidity"] = latest_sensors.get("humidityPercent", 75.0)
        if not input_dict.get("soil_moisture"): input_dict["soil_moisture"] = latest_sensors.get("soilMoisturePercent", 60.0)
        if not input_dict.get("light_intensity"): input_dict["light_intensity"] = latest_sensors.get("lightLux", 800.0)
        if not input_dict.get("rainfall"): input_dict["rainfall"] = latest_sensors.get("rainfall_mm", 150.0) # Default rainfall if missing

    result = prediction_service.predict(input_dict)
    if not result:
        raise HTTPException(status_code=500, detail="Prediction failed or models not loaded")
    
    response = {
        **result,
        "timestamp": datetime.now(),
        "input_data": input_dict
    }
    
    # Save prediction to history automatically
    firebase_service.save_prediction(response)
    
    return response

@app.get("/latest-sensor-data")
async def get_latest_sensor_data():
    data = firebase_service.get_latest_sensor_data()
    if not data:
        return {"message": "No sensor data available", "data": {}}
    return data

@app.get("/prediction-history")
async def get_prediction_history():
    history = firebase_service.get_prediction_history()
    return history

@app.post("/save-prediction")
async def save_prediction(data: PredictionResponse):
    success = firebase_service.save_prediction(data.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save to Firebase")
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
