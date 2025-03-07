const { 
  generateEmailReply, 
  createFineTunedModel, 
  uploadTrainingFile 
} = require('../../../src/backend/services/openai');
const { logEmailInteraction } = require('../../../src/backend/services/firebase');

// Mock dependencies
jest.mock('../../../src/backend/services/firebase', () => ({
  logEmailInteraction: jest.fn().mockResolvedValue('log-id-123')
}));

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateEmailReply', () => {
    it('should generate an AI reply for an email', async () => {
      // Mock data
      const userId = 'test-user-id';
      const emailData = {
        id: 'email-123',
        subject: 'Test Email',
        body: { content: 'This is a test email.' }
      };
      const emailThread = {
        value: [
          {
            id: 'email-123',
            subject: 'Test Email',
            bodyPreview: 'This is a test email.',
            toRecipients: [{ emailAddress: { address: 'test@example.com', name: 'Test User' } }],
            sender: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
            receivedDateTime: new Date().toISOString()
          }
        ]
      };
      
      // Call the function
      const result = await generateEmailReply(userId, emailData, emailThread);
      
      // Assertions
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(logEmailInteraction).toHaveBeenCalledWith(
        userId, 
        emailData.id, 
        expect.objectContaining({
          type: 'aiReply',
          model: expect.any(String),
          subject: emailData.subject
        })
      );
    });
    
    it('should handle empty or malformed email thread', async () => {
      // Mock data
      const userId = 'test-user-id';
      const emailData = {
        id: 'email-123',
        subject: 'Test Email',
        body: { content: 'This is a test email.' }
      };
      
      // Test with empty thread
      const emptyThread = null;
      
      // Call the function
      const result = await generateEmailReply(userId, emailData, emptyThread);
      
      // Assertions
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(logEmailInteraction).toHaveBeenCalled();
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const { OpenAI } = require('openai');
      OpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API error'))
          }
        }
      }));
      
      // Mock data
      const userId = 'test-user-id';
      const emailData = {
        id: 'email-123',
        subject: 'Test Email'
      };
      const emailThread = { value: [] };
      
      // Call the function and expect it to throw
      await expect(generateEmailReply(userId, emailData, emailThread))
        .rejects.toThrow('API error');
    });
  });
  
  describe('createFineTunedModel', () => {
    it('should create a fine-tuned model', async () => {
      // Call the function
      const result = await createFineTunedModel('file-123');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('ft-123');
      expect(result.status).toBe('created');
    });
  });
  
  describe('uploadTrainingFile', () => {
    it('should upload a training file', async () => {
      // Call the function
      const result = await uploadTrainingFile('/path/to/file.jsonl');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('file-123');
      expect(result.status).toBe('uploaded');
    });
  });
});