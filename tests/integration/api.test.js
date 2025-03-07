const request = require('supertest');
const express = require('express');
const app = require('../../src/backend/server');

// This test uses the actual server.js but with mocked dependencies
describe('API Integration Tests', () => {
  let server;
  
  beforeAll(() => {
    // Start the server for testing
    const PORT = 8082;
    server = app.listen(PORT);
  });
  
  afterAll((done) => {
    // Close the server after testing
    server.close(done);
  });
  
  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('Authentication Flow', () => {
    it('should provide auth URL', async () => {
      const response = await request(app).get('/api/auth/authorize');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(typeof response.body.authUrl).toBe('string');
    });
    
    it('should require code for token exchange', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should require userId and refreshToken for token refresh', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ userId: 'test-user-id' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Email API', () => {
    it('should require authentication for email operations', async () => {
      // This should fail because we don't have valid tokens in the test env
      const response = await request(app)
        .get('/api/email/test-user-id/messages/test-message-id');
      
      // Either 401 Unauthorized or 500 Internal Server Error due to auth failure
      expect([401, 500]).toContain(response.status);
    });
  });
  
  describe('AI API', () => {
    it('should require userId and messageId for reply generation', async () => {
      const response = await request(app)
        .post('/api/ai/reply')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should require authentication for AI operations', async () => {
      // This should fail because we don't have valid tokens in the test env
      const response = await request(app)
        .post('/api/ai/reply')
        .send({
          userId: 'test-user-id',
          messageId: 'test-message-id'
        });
      
      // Either 401 Unauthorized or 500 Internal Server Error due to auth failure
      expect([401, 500]).toContain(response.status);
    });
  });
});