import firebase_admin
from firebase_admin import credentials, db
import os
from app.config import settings

class FirebaseService:
    def __init__(self):
        self.db = None
        self.initialize_firebase()

    def initialize_firebase(self):
        try:
            if not firebase_admin._apps:
                cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {
                        'databaseURL': settings.FIREBASE_DATABASE_URL
                    })
                    print("Firebase initialized successfully.")
                else:
                    print(f"Firebase credentials not found at {cred_path}. Firebase functionality will be disabled.")
            self.db = db
        except Exception as e:
            print(f"Error initializing Firebase: {e}")

    def get_latest_sensor_data(self, node_id="node_01"):
        if not self.db: return None
        try:
            ref = self.db.reference(f'plantations/coconut_farm_01/nodes/{node_id}/sensor_readings')
            # Get the latest entry (assuming keys are timestamps or push IDs)
            data = ref.order_by_key().limit_to_last(1).get()
            if data:
                # data is a dict like {key: value}, we want value
                return list(data.values())[0]
            return None
        except Exception as e:
            print(f"Error fetching sensor data: {e}")
            return None

    def save_prediction(self, prediction_data):
        if not self.db: return False
        try:
            # Convert datetime to string for JSON serialization
            data_to_save = prediction_data.copy()
            if 'timestamp' in data_to_save and hasattr(data_to_save['timestamp'], 'isoformat'):
                data_to_save['timestamp'] = data_to_save['timestamp'].isoformat()
            
            ref = self.db.reference('plantations/coconut_farm_01/predictions')
            ref.push(data_to_save)
            return True
        except Exception as e:
            print(f"Error saving prediction: {e}")
            return False

    def get_prediction_history(self):
        if not self.db: return []
        try:
            ref = self.db.reference('plantations/coconut_farm_01/predictions')
            data = ref.get()
            if data:
                return list(data.values())
            return []
        except Exception as e:
            print(f"Error fetching prediction history: {e}")
            return []

firebase_service = FirebaseService()
