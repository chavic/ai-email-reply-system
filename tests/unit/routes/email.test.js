const request = require('supertest');
const express = require('express');
const emailRouter = require('../../../src/backend/routes/email');
const { 
  getEmailMessage, 
  createDraftEmail, 
  updateDraftEmail,
  getConversationThread
} = require('../../../src/backend/services/graph');

// Mock dependencies
jest.mock('../../../src/backend/services/graph', () => ({
  getEmailMessage: jest.fn().mockResolvedValue({
    id: 'email-123',
    subject: 'Test Email',
    body: { content: 'This is a test email body.' }
  }),
  createDraftEmail: jest.fn().mockResolvedValue({
    id: 'draft-123',
    subject: 'Draft Email'
  }),
  updateDraftEmail: jest.fn().mockResolvedValue({
    id: 'updated-123',
    subject: 'Updated Draft'
  }),
  getConversationThread: jest.fn().mockResolvedValue({
    value: [
      {
        id: 'email-123',
        subject: 'Test Email',
        bodyPreview: 'Test email body'
      }
    ]
  })
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/email', emailRouter);

describe('Email Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/email/:userId/messages/:messageId', () => {
    it('should get email message by ID', async () => {
      const response = await request(app)
        .get('/api/email/test-user-id/messages/test-message-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'email-123');
      expect(response.body).toHaveProperty('subject', 'Test Email');
      expect(getEmailMessage).toHaveBeenCalledWith('test-user-id', 'test-message-id');
    });
    
    it('should handle errors', async () => {
      // Mock error
      getEmailMessage.mockRejectedValueOnce(new Error('Failed to fetch email'));
      
      const response = await request(app)
        .get('/api/email/test-user-id/messages/test-message-id');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/email/:userId/threads/:threadId', () => {
    it('should get conversation thread', async () => {
      const response = await request(app)
        .get('/api/email/test-user-id/threads/test-thread-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('value');
      expect(response.body.value).toBeInstanceOf(Array);
      expect(getConversationThread).toHaveBeenCalledWith('test-user-id', 'test-thread-id');
    });
    
    it('should handle errors', async () => {
      // Mock error
      getConversationThread.mockRejectedValueOnce(new Error('Failed to fetch thread'));
      
      const response = await request(app)
        .get('/api/email/test-user-id/threads/test-thread-id');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/email/:userId/drafts', () => {
    it('should create draft email', async () => {
      const messageData = {
        subject: 'New Draft',
        body: {
          content: 'Draft content',
          contentType: 'text'
        }
      };
      
      const response = await request(app)
        .post('/api/email/test-user-id/drafts')
        .send(messageData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'draft-123');
      expect(createDraftEmail).toHaveBeenCalledWith('test-user-id', messageData);
    });
    
    it('should handle errors', async () => {
      // Mock error
      createDraftEmail.mockRejectedValueOnce(new Error('Failed to create draft'));
      
      const response = await request(app)
        .post('/api/email/test-user-id/drafts')
        .send({});
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PATCH /api/email/:userId/drafts/:messageId', () => {
    it('should update draft email', async () => {
      const updates = {
        subject: 'Updated Subject'
      };
      
      const response = await request(app)
        .patch('/api/email/test-user-id/drafts/draft-123')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'updated-123');
      expect(updateDraftEmail).toHaveBeenCalledWith('test-user-id', 'draft-123', updates);
    });
    
    it('should handle errors', async () => {
      // Mock error
      updateDraftEmail.mockRejectedValueOnce(new Error('Failed to update draft'));
      
      const response = await request(app)
        .patch('/api/email/test-user-id/drafts/draft-123')
        .send({});
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});