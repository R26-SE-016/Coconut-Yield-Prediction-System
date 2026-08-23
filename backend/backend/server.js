const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const axios = require('axios');
const db = require('./services/firebaseService');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Gracefully handle malformed JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Malformed JSON payload received:', err.message);
    return res.status(400).json({ success: false, error: 'Malformed JSON payload' });
  }
  next();
});

// Paths configuration
const PROJECT_ROOT = path.join(__dirname, '../Coconut_Yield_Prediction');
const MASTER_FEATURES_PATH = path.join(PROJECT_ROOT, 'processed/master_features.csv');
const PYTHON_EXEC = path.join(PROJECT_ROOT, '.venv/Scripts/python.exe');
const CDA_SCRAPER_PATH = path.join(__dirname, 'cda_scraper.py');
const CDA_RATES_FILE = path.join(__dirname, 'cda_rates.json');

// Estates configuration (synced with config.py)
const ESTATES = {
  "Makandura": { lat: 7.3235, lon: 79.9825, zone: "Intermediate" },
  "Mellawa": { lat: 7.4208, lon: 80.1417, zone: "Intermediate" },
  "Muruthenge": { lat: 7.3482, lon: 80.1340, zone: "Intermediate" },
  "Hewana": { lat: 7.2831, lon: 80.0514, zone: "Intermediate" },
  "Saliya": { lat: 8.1284, lon: 79.9324, zone: "Dry" },
  "Maliga estate": { lat: 7.4721, lon: 80.2455, zone: "Intermediate" },
  "Henwalawwa": { lat: 7.2514, lon: 80.2812, zone: "Intermediate" },
  "Jawatta": { lat: 7.0911, lon: 79.9723, zone: "Wet" }
};

// Simple helper to parse CSV files into JSON array
function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;
    const obj = {};
    headers.forEach((header, idx) => {
      const val = values[idx];
      if (val === '' || val === 'nan') {
        obj[header] = null;
      } else if (!isNaN(val)) {
        obj[header] = parseFloat(val);
      } else {
        obj[header] = val;
      }
    });
    records.push(obj);
  }
  return records;
}

/* =========================================================================
   1. Farm Operations
   ========================================================================= */

// GET /api/farms?uid=...
app.get('/api/farms', async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const farms = await db.getFarms(uid);
    res.json({ success: true, farms });
  } catch (err) {
    console.error("[Farms GET] Error:", err.message);
    res.status(500).json({ success: false, error: err.message, farms: [] });
  }
});

// POST /api/farms
app.post('/api/farms', async (req, res) => {
  const { uid, farm } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const result = await db.createFarm(uid, farm || {});
    res.json({ success: true, id: result.id, farm: result.farm });
  } catch (err) {
    console.error("[Farms POST] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/farms/:farmId?uid=...
app.get('/api/farms/:farmId', async (req, res) => {
  const { farmId } = req.params;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const farm = await db.getFarm(uid, farmId);
    res.json({ success: true, farm });
  } catch (err) {
    console.error("[Farm GET ID] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/farms/:farmId
app.put('/api/farms/:farmId', async (req, res) => {
  const { farmId } = req.params;
  const { uid, patch } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    await db.updateFarm(uid, farmId, patch);
    res.json({ success: true });
  } catch (err) {
    console.error("[Farm PUT] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/farms/:farmId?uid=...
app.delete('/api/farms/:farmId', async (req, res) => {
  const { farmId } = req.params;
  const uid = req.query.uid || req.body?.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    await db.deleteFarm(uid, farmId);
    res.json({ success: true });
  } catch (err) {
    console.error("[Farm DELETE] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================================
   2. Zone Operations
   ========================================================================= */

// GET /api/farms/:farmId/zones?uid=...
app.get('/api/farms/:farmId/zones', async (req, res) => {
  const { farmId } = req.params;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const zones = await db.getZones(uid, farmId);
    res.json({ success: true, zones });
  } catch (err) {
    console.error("[Zones GET] Error:", err.message);
    res.status(500).json({ success: false, error: err.message, zones: [] });
  }
});

// POST /api/farms/:farmId/zones
app.post('/api/farms/:farmId/zones', async (req, res) => {
  const { farmId } = req.params;
  const { uid, zone } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const result = await db.createZone(uid, farmId, zone || {});
    res.json({ success: true, id: result.id, zone: result.zone });
  } catch (err) {
    console.error("[Zones POST] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/farms/:farmId/zones/:zoneId
app.put('/api/farms/:farmId/zones/:zoneId', async (req, res) => {
  const { farmId, zoneId } = req.params;
  const { uid, patch } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    await db.updateZone(uid, farmId, zoneId, patch);
    res.json({ success: true });
  } catch (err) {
    console.error("[Zone PUT] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/farms/:farmId/zones/:zoneId
app.delete('/api/farms/:farmId/zones/:zoneId', async (req, res) => {
  const { farmId, zoneId } = req.params;
  const uid = req.query.uid || req.body?.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    await db.deleteZone(uid, farmId, zoneId);
    res.json({ success: true });
  } catch (err) {
    console.error("[Zone DELETE] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================================
   3. Tree-Wise Operations
   ========================================================================= */

// GET /api/farms/:farmId/trees?uid=...
app.get('/api/farms/:farmId/trees', async (req, res) => {
  const { farmId } = req.params;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const trees = await db.getTrees(uid, farmId);
    res.json({ success: true, trees });
  } catch (err) {
    console.error("[Trees GET] Error:", err.message);
    res.status(500).json({ success: false, error: err.message, trees: {} });
  }
});

// GET /api/farms/:farmId/trees/:treeId?uid=...
app.get('/api/farms/:farmId/trees/:treeId', async (req, res) => {
  const { farmId, treeId } = req.params;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const tree = await db.getTree(uid, farmId, treeId);
    res.json({ success: true, tree });
  } catch (err) {
    console.error("[Tree GET ID] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/farms/:farmId/trees/:treeId
app.put('/api/farms/:farmId/trees/:treeId', async (req, res) => {
  const { farmId, treeId } = req.params;
  const { uid, patch, tree } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    if (tree) {
      await db.upsertTree(uid, farmId, treeId, tree);
    } else {
      await db.updateTree(uid, farmId, treeId, patch);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Tree PUT] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/farms/:farmId/trees/:treeId/history
app.post('/api/farms/:farmId/trees/:treeId/history', async (req, res) => {
  const { farmId, treeId } = req.params;
  const { uid, record } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const result = await db.addTreeHistory(uid, farmId, treeId, record || {});
    res.json(result);
  } catch (err) {
    console.error("[Tree History POST] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================================
   4. IoT Device Presence
   ========================================================================= */

// GET /api/devices/:deviceId/latest
app.get('/api/devices/:deviceId/latest', async (req, res) => {
  const { deviceId } = req.params;
  try {
    const latest = await db.getDeviceLatest(deviceId);
    res.json({ success: true, latest, isLive: !!latest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, isLive: false });
  }
});

/* =========================================================================
   4b. Harvest Logs Operations
   ========================================================================= */

// GET /api/farms/:farmId/harvests?uid=...
app.get('/api/farms/:farmId/harvests', async (req, res) => {
  const { farmId } = req.params;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const logs = await db.getHarvestLogs(uid, farmId);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("[Harvests GET] Error:", err.message);
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

// POST /api/farms/:farmId/harvests
app.post('/api/farms/:farmId/harvests', async (req, res) => {
  const { farmId } = req.params;
  const { uid, log, logId } = req.body;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    const result = await db.saveHarvestLog(uid, farmId, log, logId);
    res.json(result);
  } catch (err) {
    console.error("[Harvests POST] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/farms/:farmId/harvests/:logId
app.delete('/api/farms/:farmId/harvests/:logId', async (req, res) => {
  const { farmId, logId } = req.params;
  const uid = req.query.uid || req.body?.uid;
  if (!uid) return res.status(400).json({ success: false, error: "Missing uid parameter" });
  try {
    await db.deleteHarvestLog(uid, farmId, logId);
    res.json({ success: true });
  } catch (err) {
    console.error("[Harvest DELETE] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================================
   5. CDA Market Rates & Estates & History
   ========================================================================= */

// GET /api/estates
app.get('/api/estates', (req, res) => {
  res.json({ success: true, estates: ESTATES });
});

// GET /api/history
app.get('/api/history', (req, res) => {
  try {
    const data = parseCsv(MASTER_FEATURES_PATH);
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Historical master dataset not found. Run model pipelines first."
      });
    }
    data.sort((a, b) => {
      if (a.District !== b.District) return a.District.localeCompare(b.District);
      if (a.Year !== b.Year) return a.Year - b.Year;
      return a.Month - b.Month;
    });
    res.json({ success: true, records: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/cda-rates
app.get('/api/cda-rates', (req, res) => {
  try {
    if (!fs.existsSync(CDA_RATES_FILE)) {
      return res.json({
        success: true,
        a_grade_price: 155,
        b_grade_price: 120,
        c_grade_price: 95,
        last_updated: "2026-08-20"
      });
    }
    const fileData = fs.readFileSync(CDA_RATES_FILE, 'utf8');
    const rawData = JSON.parse(fileData);
    res.json({
      success: true,
      a_grade_price: rawData.a_grade_price ?? 155,
      b_grade_price: rawData.b_grade_price ?? 120,
      c_grade_price: rawData.c_grade_price ?? 95,
      last_updated: rawData.last_updated ?? "2026-08-20"
    });
  } catch (err) {
    res.json({
      success: true,
      a_grade_price: 155,
      b_grade_price: 120,
      c_grade_price: 95,
      last_updated: "2026-08-20"
    });
  }
});

/* =========================================================================
   6. ML Model Inference Proxy (Forward to Flask Port 5001)
   ========================================================================= */

app.post('/api/predict', async (req, res) => {
  try {
    const { farm_id, uid } = req.body;
    let farm = req.body;

    if (farm_id && uid) {
      try {
        const farmData = await db.getFarm(uid, farm_id);
        if (farmData) {
          farm = {
            ...farm,
            estate: farmData.locationName,
            total_trees: farmData.totalTrees,
            last_harvest_yield: farmData.lastHarvestYield || null,
          };
        }
      } catch (e) {
        console.warn("[Predict] Could not fetch farm from DB, using payload:", e.message);
      }
    }

    const pythonPayload = {
      estate: farm.estate || farm.district || "Makandura",
      trees_count: farm.total_trees || farm.trees_count || 40,
      last_harvest_yield: farm.last_harvest_yield || null,
      actual_harvest_logs: farm.actual_harvest_logs || []
    };

    const response = await axios.post('http://127.0.0.1:5001/predict', pythonPayload);
    res.json(response.data);
  } catch (err) {
    console.error("Python API Error:", err.message);
    const status = err.response ? err.response.status : 500;
    const errorData = err.response ? err.response.data : { error: err.message };
    res.status(status).json({
      success: false,
      error: "Failed to connect to ML Prediction service",
      details: errorData
    });
  }
});

// Schedule CDA Scraper (runs every day at midnight)
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled CDA market rates scraper...');
  const pythonProcess = spawn(PYTHON_EXEC, [CDA_SCRAPER_PATH]);
  pythonProcess.on('close', (code) => {
    console.log(`CDA scraper finished with code ${code}`);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Node.js Coconut Yield API backend running at http://localhost:${PORT}`);
});