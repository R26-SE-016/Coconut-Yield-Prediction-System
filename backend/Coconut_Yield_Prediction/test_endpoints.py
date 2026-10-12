import requests
import json

url = "http://127.0.0.1:5001/predict"

def test_endpoint(name, payload):
    print(f"\n--- {name} ---")
    print("Request Payload:", json.dumps(payload))
    try:
        response = requests.post(url, json=payload)
        print("HTTP Status:", response.status_code)
        print("Response:", json.dumps(response.json()))
    except Exception as e:
        print("Error:", e)

# 1. Valid prediction request
test_endpoint("1. Valid Request", {
    "estate": "Kurunegala",
    "year": 2025,
    "month": 6,
    "trees_count": 50,
    "variety": "Tall",
    "soil_ph": 6.5,
    "soil_moisture": 50
})

# 2. Missing required fields (e.g., no estate)
test_endpoint("2. Missing Required Fields", {
    "year": 2025,
    "month": 6
})

# 3. Invalid input types
test_endpoint("3. Invalid Input Types", {
    "estate": "Kurunegala",
    "trees_count": "fifty"
})

# 4a. Suitable soil pH=6.5
test_endpoint("4a. Suitable soil pH=6.5", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "soil_ph": 6.5
})

# 4b. Acidic soil pH=4.0
test_endpoint("4b. Acidic soil pH=4.0", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "soil_ph": 4.0
})

# 5a. Normal moisture=50
test_endpoint("5a. Normal Moisture", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "soil_moisture": 50
})

# 5b. Low moisture=10
test_endpoint("5b. Low Moisture", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "soil_moisture": 10
})

# 6a. Hybrid variety
test_endpoint("6a. Hybrid Variety", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "variety": "Hybrid"
})

# 6b. Dwarf variety
test_endpoint("6b. Dwarf Variety", {
    "estate": "Kurunegala",
    "trees_count": 50,
    "variety": "Dwarf"
})
