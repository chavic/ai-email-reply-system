const express = require('express');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { storeUserTokens } = require('../services/firebase');

const router = express.Router();

// Microsoft authentication configuration
const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}`
  }
};

const msalClient = new ConfidentialClientApplication(msalConfig);

// Required Microsoft Graph permissions
const SCOPES = [
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'offline_access'
];

// Generate authorization URL
router.get('/authorize', (req, res) => {
  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri: process.env.REDIRECT_URI,
    responseMode: 'query'
  };

  msalClient.getAuthCodeUrl(authCodeUrlParameters)
    .then((url) => {
      res.json({ authUrl: url });
    })
    .catch((error) => {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to generate authentication URL' });
    });
});

// Handle OAuth 2.0 callback
router.post('/token', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  try {
    const tokenRequest = {
      code,
      scopes: SCOPES,
      redirectUri: process.env.REDIRECT_URI
    };
    
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    
    // Store tokens in Firebase
    await storeUserTokens(response.account.homeAccountId, {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresOn: response.expiresOn
    });
    
    res.json({
      userId: response.account.homeAccountId,
      userName: response.account.name,
      userEmail: response.account.username
    });
  } catch (error) {
    console.error('Token acquisition error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const { userId, refreshToken } = req.body;
  
  if (!userId || !refreshToken) {
    return res.status(400).json({ error: 'User ID and refresh token are required' });
  }
  
  try {
    const tokenRequest = {
      refreshToken,
      scopes: SCOPES
    };
    
    const response = await msalClient.acquireTokenByRefreshToken(tokenRequest);
    
    // Store updated tokens in Firebase
    await storeUserTokens(userId, {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || refreshToken,
      expiresOn: response.expiresOn
    });
    
    res.json({
      accessToken: response.accessToken,
      expiresOn: response.expiresOn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;