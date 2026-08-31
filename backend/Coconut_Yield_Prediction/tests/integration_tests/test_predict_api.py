import pytest
import json
import sys
import os

# Add the parent directory to sys.path so we can import predict_api
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from predict_api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_predict_missing_location(client):
    """Test that the prediction API returns 400 when estate/district is missing"""
    response = client.post('/predict', json={
        "year": 2025,
        "month": 1,
        "trees_count": 50
    })
    data = json.loads(response.data)
    
    assert response.status_code == 400
    assert data["success"] is False
    assert "Missing estate or district parameter" in data["error"]

def test_predict_valid_location(client):
    """Test that a valid location returns a successful prediction response"""
    # Note: This test requires the models and features to be present.
    response = client.post('/predict', json={
        "estate": "Makandura",
        "year": 2025,
        "month": 1,
        "trees_count": 50
    })
    
    data = json.loads(response.data)
    
    if response.status_code == 200:
        assert data["success"] is True
        assert "predicted_monthly_yield" in data
        assert data["estate"] == "Makandura"
    else:
        # If models aren't loaded, we expect a 500 error specifically saying so.
        assert response.status_code == 500
        assert data["success"] is False
        assert "Models not loaded" in data["error"]
