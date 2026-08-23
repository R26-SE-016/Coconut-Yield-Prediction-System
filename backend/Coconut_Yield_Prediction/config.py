import os
from pathlib import Path

# Base Directories
BASE_DIR = Path(__file__).resolve().parent
NOTEBOOKS_DIR = BASE_DIR / "notebooks"
INPUT_DIR = BASE_DIR / "input"
RAW_DIR = BASE_DIR / "raw"
PROCESSED_DIR = BASE_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
OUTPUTS_DIR = BASE_DIR / "outputs"
FIGURES_DIR = BASE_DIR / "figures"
RESOURCES_DIR = Path("d:/A1/coco/resources")

# Sri Lankan Coconut-Growing Estates and coordinates (Centroids)
ESTATES = {
    "Makandura": {"lat": 7.3235, "lon": 79.9825, "zone": "Intermediate"},
    "Mellawa": {"lat": 7.4208, "lon": 80.1417, "zone": "Intermediate"},
    "Muruthenge": {"lat": 7.3482, "lon": 80.1340, "zone": "Intermediate"},
    "Hewana": {"lat": 7.2831, "lon": 80.0514, "zone": "Intermediate"},
    "Saliya": {"lat": 8.1284, "lon": 79.9324, "zone": "Dry"},
    "Maliga estate": {"lat": 7.4721, "lon": 80.2455, "zone": "Intermediate"},
    "Henwalawwa": {"lat": 7.2514, "lon": 80.2812, "zone": "Intermediate"},
    "Jawatta": {"lat": 7.0911, "lon": 79.9723, "zone": "Wet"},
}

# NASA POWER API settings
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
START_YEAR = 2019
END_YEAR = 2025

# NASA POWER Parameter list matching user measurements:
# PRECTOTCORR: Corrected Total Precipitation (Rainfall)
# T2M: Average Temperature at 2 Meters
# T2M_MAX: Maximum Temperature at 2 Meters
# T2M_MIN: Minimum Temperature at 2 Meters
# RH2M: Relative Humidity at 2 Meters
# ALLSKY_SFC_SW_DWN: Solar Radiation (Light/Insolation)
# GWETTOP: Surface Soil Moisture (0-5cm wetness)
# GWETROOT: Root Zone Soil Moisture (0-100cm wetness)
WEATHER_PARAMETERS = [
    "PRECTOTCORR",
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "RH2M",
    "ALLSKY_SFC_SW_DWN",
    "GWETTOP",
    "GWETROOT"
]
