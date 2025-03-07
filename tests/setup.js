// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Set testing timeouts
jest.setTimeout(15000);

// Mock Firebase for unit tests
jest.mock('../src/backend/services/firebase', () => ({
  initializeFirebase: jest.fn().mockReturnValue(true),
  getFirestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' } })
    })
  }),
  getStorage: jest.fn(),
  storeUserTokens: jest.fn().mockResolvedValue(true),
  getUserTokens: jest.fn().mockResolvedValue({
    accessToken: 'test-token',
    refreshToken: 'test-refresh-token',
    expiresOn: new Date(Date.now() + 3600000)
  }),
  logEmailInteraction: jest.fn().mockResolvedValue('log-id-123'),
  updateUserPreferences: jest.fn().mockResolvedValue(true)
}));

// Mock OpenAI for unit tests
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'This is a test AI reply for your email.' } }],
            usage: { prompt_tokens: 100, completion_tokens: 50 }
          })
        }
      },
      fineTuning: {
        jobs: {
          create: jest.fn().mockResolvedValue({ id: 'ft-123', status: 'created' })
        }
      },
      files: {
        create: jest.fn().mockResolvedValue({ id: 'file-123', status: 'uploaded' })
      }
    }))
  };
});

// Mock Microsoft Graph API for unit tests
jest.mock('@microsoft/microsoft-graph-client', () => {
  return {
    Client: {
      initWithMiddleware: jest.fn().mockReturnValue({
        api: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          id: 'message-123',
          subject: 'Test Email',
          body: { content: 'This is a test email body.' },
          toRecipients: [{ emailAddress: { address: 'test@example.com', name: 'Test User' } }],
          sender: { emailAddress: { address: 'sender@example.com', name: 'Sender' } },
          conversationId: 'conversation-123',
          receivedDateTime: new Date().toISOString()
        }),
        post: jest.fn().mockResolvedValue({ id: 'draft-123' }),
        patch: jest.fn().mockResolvedValue({ id: 'updated-123' }),
        orderby: jest.fn().mockReturnThis(),
        top: jest.fn().mockReturnThis()
      })
    },
    TokenCredentialAuthenticationProvider: jest.fn()
  };
});

// Mock MSAL for unit tests
jest.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: jest.fn().mockImplementation(() => ({
      getAuthCodeUrl: jest.fn().mockResolvedValue('https://login.microsoftonline.com/auth-url'),
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