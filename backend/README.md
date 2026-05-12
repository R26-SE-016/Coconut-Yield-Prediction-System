# Coconut Yield Prediction Backend

Low-Cost Hybrid AI and IoT Coconut Yield Prediction System.

## Project Structure
```text
backend/
├── main.py              # API entry point
├── train_model.py       # Model training script
├── requirements.txt     # Dependencies
├── .env                 # Environment variables
├── app/
│   ├── config.py        # Settings
│   ├── firebase_service.py
│   ├── schemas.py       # Pydantic models
│   ├── prediction_service.py
│   ├── preprocessing.py # Data pipeline
│   └── utils.py
├── models/              # Saved models (generated)
└── notebooks/
```

## Setup Instructions

### 1. Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Firebase Setup
1. Create a Firebase project.
2. Enable Realtime Database.
3. Go to Project Settings > Service Accounts.
4. Click "Generate new private key" and save it as `backend/serviceAccountKey.json`.
5. Create a `.env` file from `.env.example` and add your `FIREBASE_DATABASE_URL`.

### 4. Train Models
Run the training script to process the dataset and generate models in `backend/models/`.
```bash
python train_model.py
```

### 5. Run API
```bash
python main.py
```
The API will be available at `http://localhost:8000`.

## API Endpoints

- `GET /health`: Check system status.
- `POST /predict`: Get hybrid yield prediction.
- `GET /latest-sensor-data`: Fetch latest IoT data from Firebase.
- `GET /prediction-history`: Get all previous predictions.
- `POST /save-prediction`: Save a prediction result to Firebase.

## Frontend Connection
The API allows CORS from the URL defined in `.env` (default: `http://localhost:5173`).
Use the provided `predictionApi.js` in your React project.
