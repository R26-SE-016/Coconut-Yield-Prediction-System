export const mockSensorData = {
  temperature: 31,
  humidity: 78,
  soilMoisture: 62,
  lightIntensity: 680
};

export const mockYieldPrediction = {
  predictedYield: 8450,
  confidence: 87,
  modelType: "Hybrid AI Prediction Engine",
  status: "Good Yield Expected", // Good Yield Expected, Moderate Yield, Low Yield Risk
  statusColor: "text-green-600",
  lastUpdated: new Date().toLocaleDateString()
};

export const mockHistoricalComparison = {
  previousSeason: 7900,
  predictedSeason: 8450,
  change: "+6.9%"
};

export const mockChartData = {
  temperatureTrend: [
    { day: 'Mon', temp: 29 },
    { day: 'Tue', temp: 30 },
    { day: 'Wed', temp: 31 },
    { day: 'Thu', temp: 31 },
    { day: 'Fri', temp: 32 },
    { day: 'Sat', temp: 31 },
    { day: 'Sun', temp: 30 },
  ],
  soilMoistureTrend: [
    { day: 'Mon', moisture: 58 },
    { day: 'Tue', moisture: 55 },
    { day: 'Wed', moisture: 60 },
    { day: 'Thu', moisture: 62 },
    { day: 'Fri', moisture: 65 },
    { day: 'Sat', moisture: 61 },
    { day: 'Sun', moisture: 62 },
  ],
  yieldComparison: [
    { season: 'Spring 2024', yield: 7500 },
    { season: 'Fall 2024', yield: 7900 },
    { season: 'Spring 2025', yield: 8100 },
    { season: 'Fall 2025', yield: 8450 },
  ],
  featureImportance: [
    { feature: 'Soil Moisture', importance: 85 },
    { feature: 'Temperature', importance: 70 },
    { feature: 'Humidity', importance: 60 },
    { feature: 'Light Intensity', importance: 45 },
    { feature: 'Historical Yield', importance: 90 },
  ]
};
