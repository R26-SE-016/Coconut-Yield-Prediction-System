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
  const response = await axios.get(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}.json`);
  const data = response.data;
  if (!data) return [];
  const arr = Object.entries(data).map(([id, val]) => ({
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
  }));
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
  await axios.delete(`${FIREBASE_DB_URL}/harvests/${uid}/${farmId}/${logId}.json`);
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
