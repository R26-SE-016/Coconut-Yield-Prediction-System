import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SystemOverview from './components/SystemOverview';
import FarmerSummaryCard from './components/FarmerSummaryCard';
import RealtimeWeatherPanel from './components/RealtimeWeatherPanel';
import FarmSetupCard from './components/FarmSetupCard';
import SensorDashboard from './components/SensorDashboard';
import YieldPrediction from './components/YieldPrediction';
import AnalyticsCharts from './components/AnalyticsCharts';
import HistoricalComparison from './components/HistoricalComparison';
import SystemFlow from './components/SystemFlow';
import AboutResearch from './components/AboutResearch';
import Footer from './components/Footer';
import ModelMetricsSidebar from './components/ModelMetricsSidebar';
import { usePlantationTelemetry } from './hooks/usePlantationTelemetry';
import { mockChartData, mockHistoricalComparison, mockSensorData, mockYieldPrediction } from './data/mockData';

const FARM_PROFILE_STORAGE_KEY = '_farm_profile';

function readStoredFarmProfile() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(FARM_PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getDefaultFarmProfile() {
  return {
    farmName: 'Sri Lankan Coconut Farm',
    block: 'Block A',
    treeCount: 100,
    cropAge: 8,
    location: 'Sri Lanka',
  };
}

function translateAlerts(telemetry, t) {
  const alerts = [];
  const latest = telemetry.latestReading || {};

  if (typeof latest.soilMoisturePercent === 'number' && latest.soilMoisturePercent < 35) {
    alerts.push(t('alerts.low_moisture'));
  }

  if (typeof latest.temperatureC === 'number' && latest.temperatureC >= 34) {
    alerts.push(t('alerts.high_heat'));
  }

  if (typeof latest.humidityPercent === 'number' && (latest.humidityPercent < 45 || latest.humidityPercent > 90)) {
    alerts.push(t('alerts.humidity'));
  }

  if (telemetry.connectionState === 'error' || !latest || !Object.keys(latest).length) {
    alerts.push(t('alerts.sensor_failure'));
  }

  if (telemetry.systemSummary?.wifiSignal !== undefined && telemetry.systemSummary.wifiSignal < -75) {
    alerts.push(t('alerts.connectivity'));
  }

  return Array.from(new Set(alerts));
}

function buildFarmerSummary(telemetry, t) {
  const latest = telemetry.latestReading || {};
  const soilMoisture = latest.soilMoisturePercent;
  const temperature = latest.temperatureC;
  const humidity = latest.humidityPercent;
  const wifiSignal = telemetry.systemSummary?.wifiSignal;

  if ((typeof soilMoisture === 'number' && soilMoisture < 30) || (typeof temperature === 'number' && temperature >= 36) || telemetry.connectionState === 'error') {
    return {
      level: 'critical',
      message: t('summary.summary_critical'),
      action: t('summary.action_critical'),
      yieldOutlook: 'At risk',
      yieldNote: t('summary.yield_critical'),
      keySignal: {
        type: 'soilMoisture',
        label: 'Soil moisture',
        value: typeof soilMoisture === 'number' ? `${soilMoisture}%` : 'No reading',
      },
    };
  }

  if ((typeof soilMoisture === 'number' && soilMoisture < 42) || (typeof temperature === 'number' && temperature >= 34) || (typeof humidity === 'number' && humidity > 90) || (typeof wifiSignal === 'number' && wifiSignal < -70)) {
    return {
      level: 'watch',
      message: t('summary.summary_watch'),
      action: t('summary.action_watch'),
      yieldOutlook: 'Moderate',
      yieldNote: t('summary.yield_watch'),
      keySignal: {
        type: 'temperature',
        label: 'Temperature',
        value: typeof temperature === 'number' ? `${temperature}°C` : 'No reading',
      },
    };
  }

  return {
    level: 'good',
    message: t('summary.summary_stable'),
    action: t('summary.action_stable'),
    yieldOutlook: 'Healthy',
    yieldNote: t('summary.yield_stable'),
    keySignal: {
      type: 'soilMoisture',
      label: 'Soil moisture',
      value: typeof soilMoisture === 'number' ? `${soilMoisture}%` : 'Stable',
    },
  };
}

function buildDemoTelemetry() {
  return {
    connectionState: 'demo',
    error: null,
    latestReading: {
      temperatureC: mockSensorData.temperature,
      humidityPercent: mockSensorData.humidity,
      soilMoisturePercent: mockSensorData.soilMoisture,
      lightLux: mockSensorData.lightIntensity,
      wifiSignal: -49,
      timestamp: 'Demo feed',
    },
    systemSummary: {
      connectionState: 'Demo',
      deviceState: 'Active',
      uploadState: 'Uploading',
      sleepState: 'Deep sleep',
      intervalMinutes: 15,
      lastSync: 'Demo feed',
      recordCount: 7,
      ipAddress: '192.168.1.89',
      wifiSignal: -49,
    },
    snapshotCards: [
      { title: 'Temperature', value: mockSensorData.temperature, unit: '°C', note: 'Canopy heat balance', accent: 'from-orange-500/20 to-orange-200/20', ring: 'text-orange-600' },
      { title: 'Humidity', value: mockSensorData.humidity, unit: '%', note: 'Air moisture', accent: 'from-sky-500/20 to-sky-200/20', ring: 'text-sky-600' },
      { title: 'Soil Moisture', value: mockSensorData.soilMoisture, unit: '%', note: 'Root zone health', accent: 'from-emerald-500/20 to-emerald-200/20', ring: 'text-emerald-600' },
      { title: 'Light', value: mockSensorData.lightIntensity, unit: 'lux', note: 'Solar exposure', accent: 'from-amber-500/20 to-amber-200/20', ring: 'text-amber-600' },
      { title: 'Health Score', value: 86, unit: '/100', note: 'Good Yield Expected', accent: 'from-lime-500/20 to-lime-200/20', ring: 'text-lime-700' },
      { title: 'Wi-Fi RSSI', value: -49, unit: 'dBm', note: 'Connected', accent: 'from-slate-500/20 to-slate-200/20', ring: 'text-slate-600' },
    ],
    alerts: [],
    forecast: {
      estimatedYield: mockYieldPrediction.predictedYield,
      confidence: mockYieldPrediction.confidence,
      status: mockYieldPrediction.status,
      message: 'Demo mode is showing representative telemetry until the live Firebase feed comes online.',
      healthScore: 86,
      band: { label: 'Excellent', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', ring: '#10b981' },
    },
    comparison: [
      {
        label: 'Temperature',
        current: mockSensorData.temperature,
        previous: mockSensorData.temperature - 1.2,
        delta: '+1.2',
        unit: '°C',
      },
      {
        label: 'Humidity',
        current: mockSensorData.humidity,
        previous: mockSensorData.humidity - 3,
        delta: '+3.0',
        unit: '%',
      },
      {
        label: 'Soil Moisture',
        current: mockSensorData.soilMoisture,
        previous: mockSensorData.soilMoisture - 2,
        delta: '+2.0',
        unit: '%',
      },
      {
        label: 'Light',
        current: mockSensorData.lightIntensity,
        previous: mockSensorData.lightIntensity - 28,
        delta: '+28',
        unit: 'lux',
      },
    ],
    trendSeries: mockChartData.temperatureTrend.map((item, index) => ({
      label: item.day,
      temperatureC: item.temp,
      humidityPercent: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
      soilMoisturePercent: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
      lightLux: 600 + index * 12,
    })),
    radarData: [
      { subject: 'Temperature', value: 78, fullMark: 100 },
      { subject: 'Humidity', value: 82, fullMark: 100 },
      { subject: 'Soil', value: 84, fullMark: 100 },
      { subject: 'Light', value: 66, fullMark: 100 },
      { subject: 'Connectivity', value: 88, fullMark: 100 },
    ],
  };
}

function App() {
  const { t } = useTranslation();
  const telemetry = usePlantationTelemetry();
  const [farmProfile, setFarmProfile] = React.useState(() => readStoredFarmProfile() || getDefaultFarmProfile());
  const [showMetrics, setShowMetrics] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FARM_PROFILE_STORAGE_KEY, JSON.stringify(farmProfile));
  }, [farmProfile]);

  const hasLiveData = Boolean(telemetry.latestReading || telemetry.recentReadings.length || telemetry.systemSummary?.lastSync !== 'Waiting for first sync');
  const effectiveTelemetry = hasLiveData ? telemetry : buildDemoTelemetry();
  
  const chartData = telemetry.trendSeries.length ? telemetry.trendSeries : [
    ...mockChartData.temperatureTrend.map((item, index) => ({
      label: item.day,
      temperatureC: item.temp,
      humidityPercent: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
      soilMoisturePercent: mockChartData.soilMoistureTrend[index]?.moisture ?? null,
      lightLux: null,
    })),
  ];

  const comparisonData = telemetry.comparison.length ? telemetry.comparison : [
    {
      label: 'Previous season',
      current: mockHistoricalComparison.predictedSeason,
      previous: mockHistoricalComparison.previousSeason,
      delta: mockHistoricalComparison.change,
      unit: 'nuts',
    },
  ];

  const farmerSummary = buildFarmerSummary(effectiveTelemetry, t);
  const farmerAlerts = translateAlerts(effectiveTelemetry, t);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_24%),linear-gradient(180deg,#f8fff5_0%,#f7f9f4_36%,#eef6e9_100%)] text-[#1f2937] selection:bg-[#bbf7d0] selection:text-[#14532d]">
      <Navbar 
        connectionState={effectiveTelemetry.connectionState} 
        lastSync={effectiveTelemetry.systemSummary.lastSync} 
        onOpenMetrics={() => setShowMetrics(true)}
      />
      <ModelMetricsSidebar isOpen={showMetrics} onClose={() => setShowMetrics(false)} />
      <main>
        <Hero
          snapshotCards={effectiveTelemetry.snapshotCards}
          systemSummary={effectiveTelemetry.systemSummary}
          connectionState={effectiveTelemetry.connectionState}
          error={effectiveTelemetry.error}
        />
        <SystemOverview />
        <div id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          <FarmerSummaryCard summary={farmerSummary} />
          <FarmSetupCard profile={farmProfile} onChange={setFarmProfile} />
          <RealtimeWeatherPanel
            latestReading={effectiveTelemetry.latestReading}
            connectionState={effectiveTelemetry.connectionState}
          />
          <SensorDashboard
            snapshotCards={effectiveTelemetry.snapshotCards}
            systemSummary={effectiveTelemetry.systemSummary}
            alerts={farmerAlerts.length ? farmerAlerts : [t('alerts.no_alerts')]}
            connectionState={effectiveTelemetry.connectionState}
            latestReading={effectiveTelemetry.latestReading}
            isOffline={effectiveTelemetry.isOffline}
          />
          <YieldPrediction 
            forecast={effectiveTelemetry.forecast} 
            runPrediction={effectiveTelemetry.runPrediction}
            isPredicting={effectiveTelemetry.isPredicting}
            predictionResult={effectiveTelemetry.predictionResult}
            farmProfile={farmProfile}
            onOpenMetrics={() => setShowMetrics(true)}
          />
          <HistoricalComparison comparisonData={effectiveTelemetry.comparison.length ? effectiveTelemetry.comparison : comparisonData} />
        </div>
        <div id="analytics" className="bg-white py-16 border-y border-[#bbf7d0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnalyticsCharts
              trendSeries={effectiveTelemetry.trendSeries.length ? effectiveTelemetry.trendSeries : chartData}
              radarData={effectiveTelemetry.radarData}
            />
          </div>
        </div>
        <SystemFlow />
        <AboutResearch />
      </main>
      <Footer />
    </div>
  );
}

export default App;
