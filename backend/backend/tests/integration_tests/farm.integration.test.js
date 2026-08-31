const request = require('supertest');
const app = require('../../server');

// Mock Firebase service so we don't pollute the actual DB during integration tests
jest.mock('../../services/firebaseService', () => {
  let mockFarms = [];
  return {
    getFarms: jest.fn(async (uid) => mockFarms.filter(f => f.uid === uid)),
    createFarm: jest.fn(async (uid, farmData) => {
      const newFarm = { id: 'farm_test_123', uid, ...farmData };
      mockFarms.push(newFarm);
      return { id: newFarm.id, farm: newFarm };
    }),
    updateFarm: jest.fn(async (uid, farmId, patch) => {
      const index = mockFarms.findIndex(f => f.id === farmId);
      if (index >= 0) mockFarms[index] = { ...mockFarms[index], ...patch };
      return { success: true };
    }),
    deleteFarm: jest.fn(async (uid, farmId) => {
      mockFarms = mockFarms.filter(f => f.id !== farmId);
      return { success: true };
    }),
    getZones: jest.fn(async (uid, farmId) => [{ id: 'zone_1', name: 'Test Zone' }])
  };
});

describe('Node.js Backend - Firebase Integration Tests', () => {
  const testUid = 'user_test_999';
  let createdFarmId = '';

  it('POST /api/farms should reject if uid is missing', async () => {
    const response = await request(app).post('/api/farms').send({ farm: { name: 'My Farm' } });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/Missing uid/i);
  });

  it('POST /api/farms should create a farm successfully', async () => {
    const response = await request(app).post('/api/farms').send({
      uid: testUid,
      farm: { name: 'Makandura Test Farm', locationName: 'Makandura', totalTrees: 100 }
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.id).toBeDefined();
    createdFarmId = response.body.id;
  });

  it('GET /api/farms should retrieve the created farm', async () => {
    const response = await request(app).get(`/api/farms?uid=${testUid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.farms.length).toBeGreaterThan(0);
    expect(response.body.farms[0].name).toBe('Makandura Test Farm');
  });

  it('PUT /api/farms/:farmId should update the farm', async () => {
    const response = await request(app).put(`/api/farms/${createdFarmId}`).send({
      uid: testUid,
      patch: { name: 'Updated Makandura Farm' }
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('GET /api/farms/:farmId/zones should retrieve zones for the farm', async () => {
    const response = await request(app).get(`/api/farms/${createdFarmId}/zones?uid=${testUid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.zones.length).toBe(1);
    expect(response.body.zones[0].name).toBe('Test Zone');
  });

  it('DELETE /api/farms/:farmId should delete the farm successfully', async () => {
    const response = await request(app).delete(`/api/farms/${createdFarmId}?uid=${testUid}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
