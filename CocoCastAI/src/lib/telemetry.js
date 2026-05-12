const SENSOR_KEYS = [
  'temperatureC',
  'humidityPercent',
  'soilMoistureRaw',
  'soilMoisturePercent',
  'lightLux',
  'wifiSignal',
  'unixTime',
];

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeTimestamp(reading) {
  if (toNumber(reading?.unixTime) !== null) {
    return toNumber(reading.unixTime);
  }

  if (reading?.timestamp) {
    const parsed = Date.parse(String(reading.timestamp).replace(' ', 'T'));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (reading?.date && reading?.time) {
    const parsed = Date.parse(`${reading.date}T${reading.time}`);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function hasSensorLeaf(node) {
  return Boolean(node && typeof node === 'object' && SENSOR_KEYS.some((key) => key in node));
}

export function flattenReadingsTree(readingsNode) {
  const flattened = [];

  function walk(node, pathSegments = []) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (hasSensorLeaf(node)) {
      flattened.push({
        ...node,
        path: pathSegments.join('/'),
        sortTime: normalizeTimestamp(node),
      });
      return;
    }

    Object.entries(node).forEach(([key, value]) => {
      walk(value, [...pathSegments, key]);
    });
  }

  walk(readingsNode);

  return flattened.sort((left, right) => left.sortTime - right.sortTime);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreRange(value, idealMin, idealMax, min, max) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= idealMin && value <= idealMax) {
    return 100;
  }

  if (value < min || value > max) {
    return 8;
  }

  const distance = value < idealMin ? idealMin - value : value - idealMax;
  const span = value < idealMin ? idealMin - min : max - idealMax;
  const penalty = span > 0 ? (distance / span) * 72 : 72;

  return clamp(Math.round(100 - penalty), 15, 100);
}

function average(values) {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return null;
  }

  const total = numericValues.reduce((sum, value) => sum + value, 0);
  return total / numericValues.length;
}

function formatRelativeChange(currentValue, previousValue, decimals = 0) {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) {
    return 'n/a';
  }

  const difference = currentValue - previousValue;
  const prefix = difference > 0 ? '+' : '';
  return `${prefix}${difference.toFixed(decimals)}`;
}

function timeLabelForReading(reading) {
  if (reading?.timestamp) {
    return String(reading.timestamp).slice(-8);
  }

  if (reading?.timeKey) {
    const key = String(reading.timeKey);
    if (key.length === 6) {
      return `${key.slice(0, 2)}:${key.slice(2, 4)}`;
    }
    return key;
  }

  if (reading?.dayPart) {
    return String(reading.dayPart).replace('part_', 'P');
  }

  return 'Reading';
}

function qualityBand(score) {
  if (score >= 80) {
    return {
      label: 'Excellent',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      ring: '#10b981',
    };
  }

  if (score >= 60) {
    return {
      label: 'Stable',
      tone: 'text-amber-700 bg-amber-50 border-amber-200',
      ring: '#f59e0b',
    };
  }

  return {
    label: 'Attention',
    tone: 'text-rose-700 bg-rose-50 border-rose-200',
    ring: '#ef4444',
  };
}

function deriveHealthScore(reading) {
  const temperatureScore = scoreRange(toNumber(reading?.temperatureC), 27, 33, 18, 40);
  const humidityScore = scoreRange(toNumber(reading?.humidityPercent), 65, 85, 20, 100);
  const soilScore = scoreRange(toNumber(reading?.soilMoisturePercent), 45, 75, 0, 100);
  const lightScore = scoreRange(toNumber(reading?.lightLux), 450, 1250, 0, 3000);
  const wifiScore = scoreRange(toNumber(reading?.wifiSignal), -65, -30, -95, -15);

  const score = average([
    temperatureScore,
    humidityScore,
    soilScore,
    lightScore,
    wifiScore,
  ]) ?? 0;

  return clamp(Math.round(score), 0, 100);
}

function buildComparison(recentReadings) {
  const lastWindowSize = Math.max(3, Math.min(6, Math.floor(recentReadings.length / 2)));
  const currentWindow = recentReadings.slice(-lastWindowSize);
  const previousWindow = recentReadings.slice(-lastWindowSize * 2, -lastWindowSize);

  const currentTemperature = average(currentWindow.map((reading) => toNumber(reading.temperatureC)));
  const previousTemperature = average(previousWindow.map((reading) => toNumber(reading.temperatureC)));
  const currentHumidity = average(currentWindow.map((reading) => toNumber(reading.humidityPercent)));
  const previousHumidity = average(previousWindow.map((reading) => toNumber(reading.humidityPercent)));
  const currentSoil = average(currentWindow.map((reading) => toNumber(reading.soilMoisturePercent)));
  const previousSoil = average(previousWindow.map((reading) => toNumber(reading.soilMoisturePercent)));
  const currentLight = average(currentWindow.map((reading) => toNumber(reading.lightLux)));
  const previousLight = average(previousWindow.map((reading) => toNumber(reading.lightLux)));

  return [
    {
      label: 'Temperature',
      current: currentTemperature,
      previous: previousTemperature,
      delta: formatRelativeChange(currentTemperature, previousTemperature, 1),
      unit: '°C',
    },
    {
      label: 'Humidity',
      current: currentHumidity,
      previous: previousHumidity,
      delta: formatRelativeChange(currentHumidity, previousHumidity, 1),
      unit: '%',
    },
    {
      label: 'Soil Moisture',
      current: currentSoil,
      previous: previousSoil,
      delta: formatRelativeChange(currentSoil, previousSoil, 1),
      unit: '%',
    },
    {
      label: 'Light',
      current: currentLight,
      previous: previousLight,
      delta: formatRelativeChange(currentLight, previousLight, 0),
      unit: 'lux',
    },
  ];
}

function buildForecast(reading, recentReadings) {
  const healthScore = deriveHealthScore(reading);
  const trendBonus = recentReadings.length > 1
    ? clamp(Math.round((average(recentReadings.slice(-4).map((entry) => toNumber(entry.soilMoisturePercent))) ?? 50) - 50), -8, 10)
    : 0;

  const estimatedYield = clamp(Math.round(6800 + healthScore * 22 + trendBonus * 25), 5400, 9800);
  const confidence = clamp(Math.round(58 + healthScore * 0.38), 60, 96);
  const quality = qualityBand(healthScore);

  let status = 'Stable plantation outlook';
  if (healthScore < 60) {
    status = 'Stress risk detected';
  } else if (healthScore < 80) {
    status = 'Moderate yield outlook';
  }

  const message = healthScore >= 80
    ? 'Field conditions are aligned for strong growth, with soil moisture and climate readings inside the healthy band.'
    : healthScore >= 60
      ? 'Conditions are acceptable, but a tighter watch on soil and humidity will improve the next cycle.'
      : 'The current mix of temperature, moisture, or connectivity needs immediate attention.';

  return {
    healthScore,
    estimatedYield,
    confidence,
    status,
    message,
    band: quality,
  };
}

function buildRadarData(reading) {
  const temperature = clamp(Math.round(scoreRange(toNumber(reading?.temperatureC), 27, 33, 18, 40)), 0, 100);
  const humidity = clamp(Math.round(scoreRange(toNumber(reading?.humidityPercent), 65, 85, 20, 100)), 0, 100);
  const soil = clamp(Math.round(scoreRange(toNumber(reading?.soilMoisturePercent), 45, 75, 0, 100)), 0, 100);
  const light = clamp(Math.round(scoreRange(toNumber(reading?.lightLux), 450, 1250, 0, 3000)), 0, 100);
  const connectivity = clamp(Math.round(scoreRange(toNumber(reading?.wifiSignal), -65, -30, -95, -15)), 0, 100);

  return [
    { subject: 'Temperature', value: temperature, fullMark: 100 },
    { subject: 'Humidity', value: humidity, fullMark: 100 },
    { subject: 'Soil', value: soil, fullMark: 100 },
    { subject: 'Light', value: light, fullMark: 100 },
    { subject: 'Connectivity', value: connectivity, fullMark: 100 },
  ];
}

function buildTrendSeries(recentReadings) {
  return recentReadings.slice(-12).map((reading, index) => ({
    label: timeLabelForReading(reading) || `R${index + 1}`,
    temperatureC: toNumber(reading.temperatureC),
    humidityPercent: toNumber(reading.humidityPercent),
    soilMoisturePercent: toNumber(reading.soilMoisturePercent),
    lightLux: toNumber(reading.lightLux),
  }));
}

function buildSnapshotCards(reading, status, forecast) {
  return [
    {
      title: 'Temperature',
      value: Number.isFinite(toNumber(reading?.temperatureC)) ? toNumber(reading.temperatureC) : '—',
      unit: '°C',
      note: 'Canopy heat balance',
      accent: 'from-orange-500/20 to-orange-200/20',
      ring: 'text-orange-600',
    },
    {
      title: 'Humidity',
      value: Number.isFinite(toNumber(reading?.humidityPercent)) ? toNumber(reading.humidityPercent) : '—',
      unit: '%',
      note: 'Air moisture',
      accent: 'from-sky-500/20 to-sky-200/20',
      ring: 'text-sky-600',
    },
    {
      title: 'Soil Moisture',
      value: Number.isFinite(toNumber(reading?.soilMoisturePercent)) ? toNumber(reading.soilMoisturePercent) : '—',
      unit: '%',
      note: 'Root zone health',
      accent: 'from-emerald-500/20 to-emerald-200/20',
      ring: 'text-emerald-600',
    },
    {
      title: 'Light',
      value: Number.isFinite(toNumber(reading?.lightLux)) ? Math.round(toNumber(reading.lightLux)) : '—',
      unit: 'lux',
      note: 'Solar exposure',
      accent: 'from-amber-500/20 to-amber-200/20',
      ring: 'text-amber-600',
    },
    {
      title: 'Health Score',
      value: forecast.healthScore,
      unit: '/100',
      note: forecast.status,
      accent: 'from-lime-500/20 to-lime-200/20',
      ring: 'text-lime-700',
    },
    {
      title: 'Wi-Fi RSSI',
      value: Number.isFinite(toNumber(reading?.wifiSignal)) ? Math.round(toNumber(reading.wifiSignal)) : '—',
      unit: 'dBm',
      note: status?.wifiConnected ? 'Connected' : 'Offline',
      accent: 'from-slate-500/20 to-slate-200/20',
      ring: 'text-slate-600',
    },
  ];
}

function buildAlerts(reading, status, forecast) {
  const alerts = [];

  if (status && status.deviceEnabled === false) {
    alerts.push('Device is disabled from Firebase config.');
  }

  if (status && status.uploadEnabled === false) {
    alerts.push('Sensor upload is disabled in the remote configuration.');
  }

  if (Number.isFinite(toNumber(reading?.soilMoisturePercent)) && toNumber(reading.soilMoisturePercent) < 35) {
    alerts.push('Soil moisture is low. Irrigation should be reviewed.');
  }

  if (Number.isFinite(toNumber(reading?.temperatureC)) && toNumber(reading.temperatureC) > 35) {
    alerts.push('Temperature is above the ideal plantation range.');
  }

  if (forecast.healthScore < 60) {
    alerts.push('Overall field health score is in the attention range.');
  }

  return alerts;
}

function buildSystemSummary(latestReading, status, recentReadings) {
  const lastSync = latestReading?.timestamp || status?.lastBootTime || 'Waiting for first sync';

  return {
    connectionState: status?.wifiConnected ? 'Live' : 'Offline',
    deviceState: status?.deviceEnabled === false ? 'Disabled' : 'Active',
    uploadState: status?.uploadEnabled === false ? 'Paused' : 'Uploading',
    sleepState: status?.deepSleepEnabled === false ? 'Awake' : 'Deep sleep',
    intervalMinutes: status?.readingIntervalMinutes ?? null,
    lastSync,
    recordCount: recentReadings.length,
    ipAddress: status?.ipAddress || '—',
    wifiSignal: Number.isFinite(toNumber(status?.wifiSignal)) ? Math.round(toNumber(status.wifiSignal)) : null,
  };
}

export function buildTelemetryViewModel({ latest, status, readingsTree }) {
  const recentReadings = flattenReadingsTree(readingsTree);
  const latestReading = latest || recentReadings[recentReadings.length - 1] || null;
  const combinedReading = latestReading ? { ...latestReading, ...(status || {}) } : status || {};
  const forecast = buildForecast(combinedReading, recentReadings);

  return {
    latestReading,
    recentReadings,
    trendSeries: buildTrendSeries(recentReadings),
    radarData: buildRadarData(combinedReading),
    comparison: buildComparison(recentReadings),
    forecast,
    snapshotCards: buildSnapshotCards(combinedReading, status, forecast),
    alerts: buildAlerts(combinedReading, status, forecast),
    systemSummary: buildSystemSummary(combinedReading, status, recentReadings),
  };
}
