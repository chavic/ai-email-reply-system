const request = require('supertest');
const express = require('express');
const authRouter = require('../../../src/backend/routes/auth');
const { storeUserTokens } = require('../../../src/backend/services/firebase');
const { ConfidentialClientApplication } = require('@azure/msal-node');

// Mock dependencies
jest.mock('../../../src/backend/services/firebase', () => ({
  storeUserTokens: jest.fn().mockResolvedValue(true)
}));

jest.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
      getAuthCodeUrl: jest.fn().mockResolvedValue('https://login.microsoftonline.com/mock-auth-url'),
      acquireTokenByCode: jest.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresOn: new Date(Date.now() + 3600000),
        account: {
          homeAccountId: 'test-user-id',
          name: 'Test User',
          username: 'test@example.com'
        }
      }),
      acquireTokenByRefreshToken: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        expiresOn: new Date(Date.now() + 3600000)
      })
    }))
  };
});

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/auth/authorize', () => {
    it('should return auth URL', async () => {
      const response = await request(app).get('/api/auth/authorize');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toBe('https://login.microsoftonline.com/mock-auth-url');
    });
    
    it('should handle errors gracefully', async () => {
      // Mock getAuthCodeUrl to throw error
      ConfidentialClientApplication.mockImplementationOnce(() => ({
        getAuthCodeUrl: jest.fn().mockRejectedValue(new Error('Auth URL generation failed'))
      }));
      
      const response = await request(app).get('/api/auth/authorize');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/auth/token', () => {
    it('should exchange code for token', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({ code: 'test-auth-code' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', 'test-user-id');
      expect(response.body).toHaveProperty('userName', 'Test User');
      expect(response.body).toHaveProperty('userEmail', 'test@example.com');
      expect(storeUserTokens).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token'
        })
      );
    });
    
    it('should require code parameter', async () => {
      const response = await request(app)
        .post('/api/auth/token')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle token acquisition errors', async () => {
      // Mock acquireTokenByCode to throw error
      ConfidentialClientApplication.mockImplementationOnce(() => ({
        getAuthCodeUrl: jest.fn(),
        acquireTokenByCode: jest.fn().mockRejectedValue(new Error('Token acquisition failed'))
      }));
      
      const response = await request(app)
        .post('/api/auth/token')
        .send({ code: 'test-auth-code' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          userId: 'test-user-id',
          refreshToken: 'test-refresh-token'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken', 'new-access-token');
      expect(response.body).toHaveProperty('expiresOn');
      expect(storeUserTokens).toHaveBeenCalled();
    });
    
    it('should require userId and refreshToken', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          userId: 'test-user-id'
          // Missing refreshToken
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle token refresh errors', async () => {
      // Mock acquireTokenByRefreshToken to throw error
      ConfidentialClientApplication.mockImplementationOnce(() => ({
        getAuthCodeUrl: jest.fn(),
        acquireTokenByCode: jest.fn(),
        acquireTokenByRefreshToken: jest.fn().mockRejectedValue(new Error('Token refresh failed'))
      }));
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          userId: 'test-user-id',
          refreshToken: 'test-refresh-token'
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});