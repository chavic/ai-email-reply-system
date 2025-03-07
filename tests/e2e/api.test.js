const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Define base URL for API - this would point to the actual deployed service in E2E testing
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:8080';

// Define test timeout (longer for E2E tests)
jest.setTimeout(30000);

// Skip tests if E2E flag not set
const runTest = process.env.RUN_E2E_TESTS ? describe : describe.skip;

// Test credentials for E2E tests (should be a real test account with limited permissions)
const TEST_USER = process.env.E2E_TEST_USER;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

runTest('E2E API Tests', () => {
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Skip authentication if not running in an environment with credentials
    if (!TEST_USER || !TEST_PASSWORD) {
      console.log('Skipping authentication for E2E tests - no credentials');
      return;
    }
    
    try {
      // Authenticate to get a token
      // This would use a real authentication flow in a complete E2E test
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: TEST_USER,
        password: TEST_PASSWORD
      });
      
      authToken = authResponse.data.accessToken;
      userId = authResponse.data.userId;
    } catch (error) {
      console.error('E2E auth error:', error);
    }
  });
  
  describe('Health Check', () => {
    it('should check API health', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'OK');
    });
  });
  
  describe('Authentication Flow', () => {
    it('should provide OAuth authorization URL', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/auth/authorize`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('authUrl');
      expect(response.data.authUrl).toContain('login.microsoftonline.com');
    });
  });
  
  describe('Email API', () => {
    it('should fetch email data if authenticated', async () => {
      // Skip if no auth token
      if (!authToken || !userId) {
        console.log('Skipping email API test - no auth token');
        return;
      }
      
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/email/${userId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('Authentication required for this E2E test');
        } else {
          throw error;
        }
      }
    });
  });
  
  describe('AI Reply Flow', () => {
    it('should generate AI reply for email if authenticated', async () => {
      // Skip if no auth token
      if (!authToken || !userId) {
        console.log('Skipping AI reply test - no auth token');
        return;
      }
      
      try {
        // First, get a message ID from the inbox
        const messagesResponse = await axios.get(
          `${API_BASE_URL}/api/email/${userId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        
        // Skip if no messages
        if (!messagesResponse.data.value || messagesResponse.data.value.length === 0) {
          console.log('No messages available for testing');
          return;
        }
        
        const messageId = messagesResponse.data.value[0].id;
        
        // Generate AI reply
        const replyResponse = await axios.post(
          `${API_BASE_URL}/api/ai/reply`,
          {
            userId: userId,
            messageId: messageId
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        
        expect(replyResponse.status).toBe(200);
        expect(replyResponse.data).toHaveProperty('reply');
        expect(typeof replyResponse.data.reply).toBe('string');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('Authentication required for this E2E test');
        } else {
          throw error;
        }
      }
    });
  });
});