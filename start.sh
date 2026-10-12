#!/bin/sh
set -e

echo "=== [1/2] Starting Python Flask ML Service on Port 5001 ==="
cd /app/backend/Coconut_Yield_Prediction
python3 predict_api.py &

# Allow Flask a brief moment to initialize models in memory
sleep 3

echo "=== [2/2] Starting Node.js Express Backend on Port ${PORT:-5000} ==="
cd /app/backend/backend
exec node server.js
