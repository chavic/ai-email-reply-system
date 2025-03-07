const request = require('supertest');
const express = require('express');
const aiRouter = require('../../../src/backend/routes/ai');
const { generateEmailReply } = require('../../../src/backend/services/openai');
const { getEmailMessage, getConversationThread } = require('../../../src/backend/services/graph');
const { logEmailInteraction } = require('../../../src/backend/services/firebase');

// Mock dependencies
jest.mock('../../../src/backend/services/openai', () => ({
  generateEmailReply: jest.fn().mockResolvedValue('This is a test AI reply for your email.')
}));

jest.mock('../../../src/backend/services/graph', () => ({
  getEmailMessage: jest.fn().mockResolvedValue({
    id: 'email-123',
    conversationId: 'conversation-123',
    subject: 'Test Email',
    toRecipients: [{ emailAddress: { address: 'test@example.com' } }]
  }),
  getConversationThread: jest.fn().mockResolvedValue({
    value: [
      {
        id: 'email-123',
        subject: 'Test Email',
        bodyPreview: 'Test email body',
        toRecipients: [{ emailAddress: { address: 'test@example.com', name: 'Test User' } }],
        sender: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
        receivedDateTime: new Date().toISOString()
      }
    ]
  })
}));

jest.mock('../../../src/backend/services/firebase', () => ({
  logEmailInteraction: jest.fn().mockResolvedValue('log-id-123')
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

describe('AI Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/ai/reply', () => {
    it('should generate AI reply for email', async () => {
      const response = await request(app)
        .post('/api/ai/reply')
        .send({
          userId: 'test-user-id',
          messageId: 'test-message-id'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
      expect(response.body.reply).toBe('This is a test AI reply for your email.');
      expect(getEmailMessage).toHaveBeenCalledWith('test-user-id', 'test-message-id');
      expect(getConversationThread).toHaveBeenCalledWith('test-user-id', 'conversation-123');
      expect(generateEmailReply).toHaveBeenCalled();
    });
    
    it('should require userId and messageId', async () => {
      const response = await request(app)
        .post('/api/ai/reply')
        .send({
          userId: 'test-user-id'
          // Missing messageId
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle errors during reply generation', async () => {
      // Mock error in getEmailMessage
      getEmailMessage.mockRejectedValueOnce(new Error('Failed to fetch email'));
      
      const response = await request(app)
        .post('/api/ai/reply')
        .send({
          userId: 'test-user-id',
          messageId: 'test-message-id'
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/ai/log-sent-email', () => {
    it('should log sent email', async () => {
      const response = await request(app)
        .post('/api/ai/log-sent-email')
        .send({
          userId: 'test-user-id',
          messageId: 'test-message-id',
          originalReply: 'AI generated reply',
          sentContent: 'Modified reply that was actually sent'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(getEmailMessage).toHaveBeenCalledWith('test-user-id', 'test-message-id');
      expect(logEmailInteraction).toHaveBeenCalledWith(
        'test-user-id',
        'test-message-id',
        expect.objectContaining({
          type: 'sentReply',
          originalAiReply: 'AI generated reply',
          sentContent: 'Modified reply that was actually sent'
        })
      );
    });
    
    it('should require userId and messageId', async () => {
      const response = await request(app)
        .post('/api/ai/log-sent-email')
        .send({
          userId: 'test-user-id'
          // Missing messageId
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle errors during logging', async () => {
      // Mock error in getEmailMessage
      getEmailMessage.mockRejectedValueOnce(new Error('Failed to fetch email'));
      
      const response = await request(app)
        .post('/api/ai/log-sent-email')
        .send({
          userId: 'test-user-id',
          messageId: 'test-message-id',
          originalReply: 'AI generated reply',
          sentContent: 'Modified reply that was actually sent'
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});