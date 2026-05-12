import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Update this if your backend URL changes

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictYield = async (predictionData) => {
  try {
    const response = await api.post('/predict', predictionData);
    return response.data;
  } catch (error) {
    console.error('Error predicting yield:', error);
    throw error;
  }
};

export const getLatestSensorData = async () => {
  try {
    const response = await api.get('/latest-sensor-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    throw error;
  }
};

export const getPredictionHistory = async () => {
  try {
    const response = await api.get('/prediction-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    throw error;
  }
};

export const savePredictionResult = async (resultData) => {
  try {
    const response = await api.post('/save-prediction', resultData);
    return response.data;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API Health Check failed:', error);
    return { status: 'down', firebase_connected: false, models_loaded: false };
  }
};

export default {
  predictYield,
  getLatestSensorData,
  getPredictionHistory,
  savePredictionResult,
  checkApiHealth,
};
