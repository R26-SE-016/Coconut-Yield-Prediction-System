const axios = require('axios');

const FIREBASE_DB_URL = (
  process.env.FIREBASE_DB_URL || "https://cococastai-b4682-default-rtdb.firebaseio.com"
).replace(/\/$/, '');

/* =========================================================================
   1. Farms Data Access
   ========================================================================= */

async function getFarms(uid) {
  const response = await axios.get(`${FIREBASE_DB_URL}/farms/${uid}.json`);
  const data = response.data;
  if (!data) return [];
  const farms = Object.values(data);
  farms.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return farms;
}

async function getFarm(uid, farmId) {
  const response = await axios.get(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`);
  return response.data || null;
}

async function createFarm(uid, farmData) {
  const id = farmData.id || `farm_${Date.now()}`;
  const newFarm = {
    ...farmData,
    id,
    createdAt: farmData.createdAt || Date.now(),
  };
  await axios.put(`${FIREBASE_DB_URL}/farms/${uid}/${id}.json`, newFarm);
  return { id, farm: newFarm };
}

async function updateFarm(uid, farmId, patch) {
  await axios.patch(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`, patch || {});
  return { success: true };
}

async function deleteFarm(uid, farmId) {
  await Promise.all([
    axios.delete(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`),
    axios.delete(`${FIREBASE_DB_URL}/zones/${uid}/${farmId}.json`),
    axios.delete(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}.json`),
    axios.delete(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}.json`),
  ]);
  return { success: true };
}

/* =========================================================================
   2. Zones Data Access
   ========================================================================= */

async function getZones(uid, farmId) {
  const response = await axios.get(`${FIREBASE_DB_URL}/zones/${uid}/${farmId}.json`);
  const data = response.data;
  if (!data) return [];
  const zones = Object.values(data);
  zones.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return zones;
}

async function createZone(uid, farmId, zoneData) {
  const id = zoneData.id || `zone_${Date.now()}`;
  const newZone = {
    ...zoneData,
    id,
    createdAt: zoneData.createdAt || Date.now(),
  };
  await axios.put(`${FIREBASE_DB_URL}/zones/${uid}/${farmId}/${id}.json`, newZone);
  return { id, zone: newZone };
}

async function updateZone(uid, farmId, zoneId, patch) {
  await axios.patch(`${FIREBASE_DB_URL}/zones/${uid}/${farmId}/${zoneId}.json`, patch || {});
  return { success: true };
}

async function deleteZone(uid, farmId, zoneId) {
  await axios.delete(`${FIREBASE_DB_URL}/zones/${uid}/${farmId}/${zoneId}.json`);
  return { success: true };
}

/* =========================================================================
   3. Tree Data Access
   ========================================================================= */

async function getTrees(uid, farmId) {
  const response = await axios.get(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}.json`);
  return response.data || {};
}

async function getTree(uid, farmId, treeId) {
  const response = await axios.get(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}/${treeId}.json`);
  return response.data || null;
}

async function upsertTree(uid, farmId, treeId, treeData) {
  await axios.put(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}/${treeId}.json`, treeData || {});
  return { success: true };
}

async function updateTree(uid, farmId, treeId, patch) {
  await axios.patch(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}/${treeId}.json`, patch || {});
  return { success: true };
}

async function addTreeHistory(uid, farmId, treeId, record) {
  const historyKey = `rec_${Date.now()}`;
  const newRecord = { ...record, id: historyKey, timestamp: record.timestamp || Date.now() };
  await axios.put(`${FIREBASE_DB_URL}/trees/${uid}/${farmId}/${treeId}/history/${historyKey}.json`, newRecord);
  return { success: true, key: historyKey };
}

/* =========================================================================
   4. IoT Device Presence
   ========================================================================= */

async function getDeviceLatest(deviceId) {
  const response = await axios.get(`${FIREBASE_DB_URL}/devices/${deviceId}/latest.json`);
  return response.data || null;
}

/* =========================================================================
   5. Harvest Logs Data Access
   ========================================================================= */

async function getHarvestLogs(uid, farmId) {
  let arr = [];
  try {
    const response = await axios.get(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}.json`);
    const data = response.data;
    if (data) {
      arr = Object.entries(data).map(([id, val]) => ({
        id,
        date: val.date ?? "",
        nutCount: val.nutCount ?? (val.gradeA ?? 0) + (val.gradeB ?? 0) + (val.gradeC ?? 0),
        gradeA: val.gradeA ?? 0,
        gradeB: val.gradeB ?? 0,
        gradeC: val.gradeC ?? 0,
        priceA: val.priceA ?? 155,
        priceB: val.priceB ?? 120,
        priceC: val.priceC ?? 95,
        revenue: val.revenue ?? 0,
        notes: val.notes ?? "",
        createdAt: val.createdAt ?? 0,
        predicted_yield_nuts: val.predicted_yield_nuts ?? 0,
        actual_yield_nuts: val.actual_yield_nuts ?? val.nutCount ?? 0,
      }));
    }
  } catch (e) {
    console.warn("[getHarvestLogs] harvests node read:", e.message);
  }

  // Also seamlessly merge historical records from farm.yieldPredictionHistory if not already in arr
  try {
    const farmRes = await axios.get(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`);
    const farm = farmRes.data;
    if (farm && farm.yieldPredictionHistory) {
      Object.entries(farm.yieldPredictionHistory).forEach(([k, pred]) => {
        if (pred && pred.status === 'actual_recorded' && pred.actualYieldNuts) {
          const dateStr = pred.targetHarvestDate || '';
          const exists = arr.some(item => item.date && item.date.slice(0, 10) === dateStr.slice(0, 10));
          if (!exists) {
            arr.push({
              id: `pred_${k}`,
              date: dateStr,
              nutCount: pred.actualYieldNuts,
              gradeA: Math.round(pred.actualYieldNuts * 0.5),
              gradeB: Math.round(pred.actualYieldNuts * 0.3),
              gradeC: Math.round(pred.actualYieldNuts * 0.2),
              priceA: 155,
              priceB: 120,
              priceC: 95,
              revenue: 0,
              notes: `[PRED:${pred.predictedYieldNuts || 0}] Cycle ${pred.predictionNumber || ''} Harvest`,
              createdAt: dateStr ? new Date(dateStr).getTime() : Date.now(),
              predicted_yield_nuts: pred.predictedYieldNuts || 0,
              actual_yield_nuts: pred.actualYieldNuts,
            });
          }
        }
      });
    }
  } catch (e) {
    console.warn("[getHarvestLogs] yieldPredictionHistory merge:", e.message);
  }

  arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return arr;
}

async function saveHarvestLog(uid, farmId, logData, logId) {
  const id = logId || logData?.id || `harvest_${Date.now()}`;
  const newLog = { ...logData, id, createdAt: logData?.createdAt || Date.now() };
  await axios.put(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}/${id}.json`, newLog);
  return { success: true, id, log: newLog };
}

async function deleteHarvestLog(uid, farmId, logId) {
  let deletedLogDate = null;
  let allHarvests = {};
  let farm = null;

  try {
    const harvestsRes = await axios.get(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}.json`);
    allHarvests = harvestsRes.data || {};
    if (allHarvests[logId]) {
      deletedLogDate = allHarvests[logId].date || (allHarvests[logId].createdAt ? new Date(allHarvests[logId].createdAt).toISOString().slice(0, 10) : null);
    }
  } catch (e) {
    console.warn('[deleteHarvestLog] get harvests error:', e.message);
  }

  try {
    const farmRes = await axios.get(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`);
    farm = farmRes.data;
  } catch (e) {
    console.warn('[deleteHarvestLog] get farm error:', e.message);
  }

  // Delete from /harvests node
  try {
    await axios.delete(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}/${logId}.json`);
    delete allHarvests[logId];
  } catch (e) {
    console.warn('[deleteHarvestLog] delete harvest error:', e.message);
  }

  // Clean up yieldPredictionHistory if present
  if (farm && farm.yieldPredictionHistory) {
    let histModified = false;
    for (const [k, v] of Object.entries(farm.yieldPredictionHistory)) {
      const matchKey = k === logId || `pred_${k}` === logId || `pred_hist_${k}` === logId;
      const matchDate = deletedLogDate && (v.actualHarvestDate === deletedLogDate || v.targetHarvestDate === deletedLogDate);
      if (matchKey || matchDate) {
        delete farm.yieldPredictionHistory[k];
        histModified = true;
      }
    }
    if (histModified) {
      try {
        await axios.put(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}/yieldPredictionHistory.json`, farm.yieldPredictionHistory);
      } catch (e) {
        console.warn('[deleteHarvestLog] put yieldPredictionHistory error:', e.message);
      }
    }
  }

  // Recalculate farm's lastHarvestDate & lastHarvestYield from remaining records
  if (farm) {
    const remainingLogs = Object.values(allHarvests).filter(Boolean);
    remainingLogs.sort((a, b) => {
      const timeA = new Date(a.date || a.createdAt).getTime() || 0;
      const timeB = new Date(b.date || b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    let newLastDate = null;
    let newLastYield = null;

    if (remainingLogs.length > 0) {
      newLastDate = remainingLogs[0].date || new Date(remainingLogs[0].createdAt).toISOString().slice(0, 10);
      newLastYield = remainingLogs[0].actual_yield_nuts ?? remainingLogs[0].nutCount ?? 0;
    } else {
      newLastDate = farm.initialHarvestDate || farm.last_harvest_date || farm.createdAt;
      newLastYield = farm.initialHarvestYield ?? farm.last_harvest_yield ?? 0;
    }

    const farmPatch = {
      lastHarvestDate: newLastDate,
      lastHarvestYield: Number(newLastYield) || 0,
    };

    try {
      await axios.patch(`${FIREBASE_DB_URL}/farms/${uid}/${farmId}.json`, farmPatch);
    } catch (e) {
      console.warn('[deleteHarvestLog] patch farm error:', e.message);
    }
  }

  return { success: true };
}

module.exports = {
  FIREBASE_DB_URL,
  getFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getTrees,
  getTree,
  upsertTree,
  updateTree,
  addTreeHistory,
  getDeviceLatest,
  getHarvestLogs,
  saveHarvestLog,
  deleteHarvestLog,
};
