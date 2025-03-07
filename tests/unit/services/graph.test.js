const { 
  getGraphClientForUser, 
  getEmailMessage, 
  createDraftEmail, 
  updateDraftEmail,
  getConversationThread
} = require('../../../src/backend/services/graph');
const { getUserTokens, storeUserTokens } = require('../../../src/backend/services/firebase');

// Mock dependencies
jest.mock('../../../src/backend/services/firebase', () => ({
  getUserTokens: jest.fn(),
  storeUserTokens: jest.fn()
}));

describe('Microsoft Graph Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    getUserTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresOn: new Date(Date.now() + 3600000)
    });
    
    storeUserTokens.mockResolvedValue(true);
  });
  
  describe('getGraphClientForUser', () => {
    it('should create a Microsoft Graph client for a user', async () => {
      // Call the function
      const client = await getGraphClientForUser('test-user-id');
      
      // Assertions
      expect(client).toBeDefined();
      expect(client.api).toBeDefined();
      expect(getUserTokens).toHaveBeenCalledWith('test-user-id');
    });
    
    it('should handle missing tokens', async () => {
      // Mock missing tokens
      getUserTokens.mockResolvedValueOnce(null);
      
      // Call the function and expect it to throw
      await expect(getGraphClientForUser('test-user-id'))
        .rejects.toThrow('User not authenticated or missing refresh token');
    });
    
    it('should cache the client for repeated calls', async () => {
      // Call twice with same user ID
      const client1 = await getGraphClientForUser('test-user-id');
      const client2 = await getGraphClientForUser('test-user-id');
      
      // Assertions
      expect(client1).toBe(client2); // Same instance from cache
      expect(getUserTokens).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });
  
  describe('getEmailMessage', () => {
    it('should fetch an email message by ID', async () => {
      // Call the function
      const email = await getEmailMessage('test-user-id', 'test-message-id');
      
      // Assertions
      expect(email).toBeDefined();
      expect(email.id).toBeDefined();
      expect(email.subject).toBeDefined();
    });
  });
  
  describe('createDraftEmail', () => {
    it('should create a draft email', async () => {
      // Mock message data
      const message = {
        subject: 'Test Draft',
        body: {
          content: 'This is a test draft email.',
          contentType: 'text'
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'recipient@example.com',
              name: 'Recipient'
            }
          }
        ]
      };
      
      // Call the function
      const draft = await createDraftEmail('test-user-id', message);
      
      // Assertions
      expect(draft).toBeDefined();
      expect(draft.id).toBe('draft-123');
    });
  });
  
  describe('updateDraftEmail', () => {
    it('should update a draft email', async () => {
      // Mock update data
      const updates = {
        subject: 'Updated Subject',
        body: {
          content: 'Updated content',
          contentType: 'text'
        }
      };
      
      // Call the function
      const result = await updateDraftEmail('test-user-id', 'draft-123', updates);
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('updated-123');
    });
  });
  
  describe('getConversationThread', () => {
    it('should fetch the conversation thread', async () => {
      // Call the function
      const thread = await getConversationThread('test-user-id', 'test-thread-id');
      
      // Assertions
      expect(thread).toBeDefined();
      expect(thread.id).toBeDefined();
    });
  });
});