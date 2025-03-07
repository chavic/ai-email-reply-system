const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const NodeCache = require('node-cache');
const { getUserTokens, storeUserTokens } = require('./firebase');

// Cache for Microsoft Graph clients
const clientCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

/**
 * Get Microsoft authentication client
 */
function getMsalClient() {
  const msalConfig = {
    auth: {
      clientId: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`
    }
  };
  
  return new ConfidentialClientApplication(msalConfig);
}

/**
 * Create custom credential provider for Microsoft Graph
 * @param {string} userId - Microsoft user ID
 */
async function createCredentialProvider(userId) {
  const msalClient = getMsalClient();
  const tokens = await getUserTokens(userId);
  
  if (!tokens || !tokens.refreshToken) {
    throw new Error('User not authenticated or missing refresh token');
  }
  
  // Function to acquire tokens silently
  const getTokenSilent = async (scopes) => {
    try {
      const tokenRequest = {
        scopes: scopes || ['https://graph.microsoft.com/.default'],
        refreshToken: tokens.refreshToken
      };
      
      const response = await msalClient.acquireTokenByRefreshToken(tokenRequest);
      
      // Update tokens in Firebase
      await storeUserTokens(userId, {
        accessToken: response.accessToken,
        refreshToken: tokens.refreshToken, // Keep existing refresh token
        expiresOn: response.expiresOn
      });
      
      return response.accessToken;
    } catch (error) {
      console.error('Token acquisition error:', error);
      throw error;
    }
  };
  
  // Create auth provider
  return new TokenCredentialAuthenticationProvider({
    getToken: async (scopes) => {
      return await getTokenSilent(scopes);
    }
  });
}

/**
 * Get Microsoft Graph client for user
 * @param {string} userId - Microsoft user ID
 */
async function getGraphClientForUser(userId) {
  // Check cache first
  if (clientCache.has(userId)) {
    return clientCache.get(userId);
  }
  
  try {
    const authProvider = await createCredentialProvider(userId);
    
    // Initialize Graph client
    const client = Client.initWithMiddleware({
      authProvider,
      defaultVersion: 'v1.0'
    });
    
    // Cache the client
    clientCache.set(userId, client);
    
    return client;
  } catch (error) {
    console.error('Error creating Graph client:', error);
    throw error;
  }
}

/**
 * Get email message by ID
 * @param {string} userId - Microsoft user ID
 * @param {string} messageId - Email message ID
 */
async function getEmailMessage(userId, messageId) {
  const client = await getGraphClientForUser(userId);
  return await client.api(`/me/messages/${messageId}`).get();
}

/**
 * Create draft email
 * @param {string} userId - Microsoft user ID
 * @param {object} message - Email message object
 */
async function createDraftEmail(userId, message) {
  const client = await getGraphClientForUser(userId);
  return await client.api('/me/messages').post(message);
}

/**
 * Update draft email
 * @param {string} userId - Microsoft user ID
 * @param {string} messageId - Email message ID
 * @param {object} updates - Email updates object
 */
async function updateDraftEmail(userId, messageId, updates) {
  const client = await getGraphClientForUser(userId);
  return await client.api(`/me/messages/${messageId}`).patch(updates);
}

/**
 * Get conversation thread
 * @param {string} userId - Microsoft user ID
 * @param {string} threadId - Conversation thread ID
 */
async function getConversationThread(userId, threadId) {
  const client = await getGraphClientForUser(userId);
  return await client.api(`/me/messages?$filter=conversationId eq '${threadId}'`)
    .orderby('receivedDateTime desc')
    .top(10)
    .get();
}

module.exports = {
  getGraphClientForUser,
  getEmailMessage,
  createDraftEmail,
  updateDraftEmail,
  getConversationThread
};