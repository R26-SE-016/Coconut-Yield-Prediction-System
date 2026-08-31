const request = require('supertest');
const app = require('../../server'); // Navigate back from tests/unit_tests/ to backend/

describe('Node.js Backend API Endpoints (Unit Tests)', () => {
  // Mock Firebase to avoid connecting to actual DB during unit tests
  jest.mock('../../services/firebaseService', () => ({
    getFarms: jest.fn(),
    createFarm: jest.fn(),
  }));

  describe('GET /api/estates', () => {
    it('should return a list of valid benchmark estates', async () => {
      const response = await request(app).get('/api/estates');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.estates).toBeDefined();
      expect(response.body.estates).toHaveProperty('Makandura');
      expect(response.body.estates).toHaveProperty('Jawatta');
    });
  });

  describe('GET /api/cda-rates', () => {
    it('should return default CDA rates if no district is provided', async () => {
      const response = await request(app).get('/api/cda-rates');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.a_grade_price).toBeDefined();
      expect(response.body.b_grade_price).toBeDefined();
      expect(response.body.c_grade_price).toBeDefined();
    });

    it('should handle a specific district query', async () => {
      const response = await request(app).get('/api/cda-rates?district=colombo');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requested_district).toBe('Colombo');
    });
  });
});
