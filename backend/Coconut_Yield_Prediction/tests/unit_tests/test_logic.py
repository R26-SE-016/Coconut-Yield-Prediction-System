import sys
import os

# Navigate back to Coconut_Yield_Prediction root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from predict_api import get_nearest_estate

def test_get_nearest_estate_colombo():
    """Test that colombo maps to Jawatta"""
    result = get_nearest_estate('colombo')
    assert result == 'Jawatta'

def test_get_nearest_estate_galle():
    """Test that galle maps to Maliga estate"""
    result = get_nearest_estate('galle')
    assert result == 'Maliga estate'

def test_get_nearest_estate_kurunegala():
    """Test that kurunegala maps to Makandura"""
    result = get_nearest_estate('kurunegala')
    assert result == 'Makandura'

def test_get_nearest_estate_unknown():
    """Test that unknown places default to Saliya"""
    result = get_nearest_estate('unknown_district_99')
    assert result == 'Saliya'
