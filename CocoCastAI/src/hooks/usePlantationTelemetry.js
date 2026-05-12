import { useEffect, useMemo, useState } from 'react';
import { getDatabase, onValue, ref } from 'firebase/database';
import { app } from '../firebase/firebaseConfig';
import { buildTelemetryViewModel } from '../lib/telemetry';

const DEFAULT_PATH = {
  farmId: 'coconut_farm_01',
  nodeId: 'node_01',
};

function buildBasePath({ farmId, nodeId }) {
  return `/plantations/${farmId}/nodes/${nodeId}`;
}

// Cache keys for localStorage
function getCacheKey(basePath, dataType) {
  return `telemetry_cache_${basePath.replace(/\//g, '_')}_${dataType}`;
}

// Load data from localStorage cache
function loadFromCache(basePath, dataType) {
  try {
    const cached = localStorage.getItem(getCacheKey(basePath, dataType));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('Failed to load cache:', err);
    return null;
  }
}

// Save data to localStorage cache
function saveToCache(basePath, dataType, data) {
  try {
    localStorage.setItem(getCacheKey(basePath, dataType), JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save cache:', err);
  }
}

export function usePlantationTelemetry(options = {}) {
  const { farmId = DEFAULT_PATH.farmId, nodeId = DEFAULT_PATH.nodeId } = options;
  const basePath = useMemo(() => buildBasePath({ farmId, nodeId }), [farmId, nodeId]);

  // Load from cache on mount
  const [latest, setLatest] = useState(() => loadFromCache(basePath, 'latest'));
  const [status, setStatus] = useState(() => loadFromCache(basePath, 'status'));
  const [readingsTree, setReadingsTree] = useState(() => loadFromCache(basePath, 'readingsTree'));
  const [connectionState, setConnectionState] = useState('connecting');
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    const database = getDatabase(app);
    const latestRef = ref(database, `${basePath}/latest`);
    const statusRef = ref(database, `${basePath}/status`);
    const readingsRef = ref(database, `${basePath}/readings`);

    const unsubscribeLatest = onValue(
      latestRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setLatest(data);
          saveToCache(basePath, 'latest', data);
          setConnectionState('live');
          setIsOffline(false);
          setError(null);
        }
      },
      (firebaseError) => {
        setError(firebaseError.message);
        setConnectionState('error');
        setIsOffline(true);
      },
    );

    const unsubscribeStatus = onValue(
      statusRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setStatus(data);
          saveToCache(basePath, 'status', data);
          setConnectionState('live');
          setIsOffline(false);
          setError(null);
        }
      },
      (firebaseError) => {
        setError(firebaseError.message);
        setConnectionState('error');
        setIsOffline(true);
      },
    );

    const unsubscribeReadings = onValue(
      readingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setReadingsTree(data);
          saveToCache(basePath, 'readingsTree', data);
          setConnectionState('live');
          setIsOffline(false);
          setError(null);
        }
      },
      (firebaseError) => {
        setError(firebaseError.message);
        setConnectionState('error');
        setIsOffline(true);
      },
    );

    return () => {
      unsubscribeLatest();
      unsubscribeStatus();
      unsubscribeReadings();
    };
  }, [basePath]);

  const telemetry = useMemo(
    () => buildTelemetryViewModel({ latest, status, readingsTree }),
    [latest, status, readingsTree],
  );

  return {
    ...telemetry,
    connectionState,
    error,
    isOffline,
    isPredicting,
    predictionResult,
    runPrediction: async (numberOfTrees) => {
      setIsPredicting(true);
      try {
        const response = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number_of_trees: parseInt(numberOfTrees) }),
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        setPredictionResult(result);
        return result;
      } catch (err) {
        console.error("Prediction failed:", err);
        // Optionally set a fallback error state
      } finally {
        setIsPredicting(false);
      }
    }
  };
}
