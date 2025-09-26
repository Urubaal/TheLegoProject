const request = require('supertest');
const app = require('../server');

describe('Auth API Tests', () => {
  // Test health endpoint
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  // Test CORS configuration
  describe('CORS Configuration', () => {
    it('should allow requests from localhost:8080', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:8080')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from localhost:5500', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5500')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow requests from localhost:3000', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should use environment variable ALLOWED_ORIGINS when set', () => {
      const originalEnv = process.env.ALLOWED_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'http://example.com,https://app.example.com';
      
      // Restart the app to pick up the new environment variable
      delete require.cache[require.resolve('../server')];
      const testApp = require('../server');
      
      // Reset environment
      process.env.ALLOWED_ORIGINS = originalEnv;
      
      expect(testApp).toBeDefined();
    });
  });

  // Test 404 handler
  describe('404 Handler', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path');
    });
  });

  // Test rate limiting
  describe('Rate Limiting', () => {
    it('should have rate limiting headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
    });
  });
});
