const request = require('supertest');
const app = require('../../server');
const axios = require('axios');

// Mock Firebase service so we don't pollute the actual DB during tests
jest.mock('../../services/firebaseService', () => {
  let farmStore = {};
  return {
    getFarm: jest.fn(async (uid, farmId) => farmStore[farmId] || null),
    createFarm: jest.fn(async (uid, farmData) => {
      const id = 'system_farm_999';
      farmStore[id] = { id, uid, ...farmData };
      return { id, farm: farmStore[id] };
    }),
    deleteFarm: jest.fn(async (uid, farmId) => {
      delete farmStore[farmId];
      return { success: true };
    })
  };
});

// Mock Axios for the Python ML request
jest.mock('axios');

describe('End-to-End System Tests - Full Lifecycle', () => {
  const testUid = 'sys_user_777';
  let farmId = '';

  it('1. Create a Farm successfully', async () => {
    const response = await request(app).post('/api/farms').send({
      uid: testUid,
      farm: { name: 'E2E Makandura Farm', locationName: 'Makandura', totalTrees: 50 }
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    farmId = response.body.id;
  });

  it('2. Request Yield Prediction for the created Farm', async () => {
    // Setup Axios mock to simulate Python backend response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        estate: 'Makandura',
        predicted_monthly_yield: 250,
        predicted_annual_yield_nuts: 3000
      }
    });

    const response = await request(app).post('/api/predict').send({
      farm_id: farmId,
      uid: testUid
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.predicted_monthly_yield).toBe(250);
    expect(response.body.predicted_annual_yield_nuts).toBe(3000);
    expect(axios.post).toHaveBeenCalledWith('http://127.0.0.1:5001/predict', expect.objectContaining({
      estate: 'Makandura',
      trees_count: 50
    }));
  });

  it('3. Cleanup: Delete the Farm', async () => {
    const response = await request(app).delete(`/api/farms/${farmId}?uid=${testUid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
