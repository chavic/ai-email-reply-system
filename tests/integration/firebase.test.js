// Integration tests for Firebase service
// Note: This test requires Firebase emulator or a test Firebase project
const { 
  initializeFirebase,
  getFirestore,
  storeUserTokens,
  getUserTokens,
  logEmailInteraction,
  updateUserPreferences
} = require('../../src/backend/services/firebase');

// Set environment variables for testing
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';

describe('Firebase Integration Tests', () => {
  beforeAll(() => {
    // Initialize Firebase before tests
    initializeFirebase();
  });
  
  // This is a test user ID we'll use throughout the tests
  const testUserId = `test-user-${Date.now()}`;
  
  describe('User Operations', () => {
    it('should store and retrieve user tokens', async () => {
      // Skip if not running in an environment with Firebase access
      if (process.env.SKIP_FIREBASE_INTEGRATION) {
        return;
      }
      
      // Test tokens
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresOn: new Date(Date.now() + 3600000)
      };
      
      // Store tokens
      const storeResult = await storeUserTokens(testUserId, tokens);
      expect(storeResult).toBe(true);
      
      // Retrieve tokens
      const retrievedTokens = await getUserTokens(testUserId);
      expect(retrievedTokens).toBeDefined();
      expect(retrievedTokens.accessToken).toBe(tokens.accessToken);
      expect(retrievedTokens.refreshToken).toBe(tokens.refreshToken);
    });
    
    it('should update user preferences', async () => {
      // Skip if not running in an environment with Firebase access
      if (process.env.SKIP_FIREBASE_INTEGRATION) {
        return;
      }
      
      // Test preferences
      const preferences = {
        notifications: true,
        theme: 'dark'
      };
      
      // Update preferences
      const updateResult = await updateUserPreferences(testUserId, preferences);
      expect(updateResult).toBe(true);
      
      // Verify update (would need to query Firestore directly)
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(testUserId).get();
      expect(userDoc.exists).toBe(true);
      expect(userDoc.data().preferences).toEqual(preferences);
    });
  });
  
  describe('Email Logs', () => {
    it('should log email interactions', async () => {
      // Skip if not running in an environment with Firebase access
      if (process.env.SKIP_FIREBASE_INTEGRATION) {
        return;
      }
      
      // Test log data
      const emailId = `email-${Date.now()}`;
      const logData = {
        type: 'aiReply',
        model: 'gpt-3.5-turbo',
        inputTokens: 100,
        outputTokens: 50,
        subject: 'Test Email'
      };
      
      // Log interaction
      const logId = await logEmailInteraction(testUserId, emailId, logData);
      expect(logId).toBeDefined();
      
      // Verify log (would need to query Firestore directly)
      const db = getFirestore();
      const logDoc = await db.collection('emailLogs').doc(logId).get();
      expect(logDoc.exists).toBe(true);
      expect(logDoc.data().userId).toBe(testUserId);
      expect(logDoc.data().emailId).toBe(emailId);
      expect(logDoc.data().type).toBe(logData.type);
    });
  });
  
  // Cleanup after tests (delete test data)
  afterAll(async () => {
    // Skip if not running in an environment with Firebase access
    if (process.env.SKIP_FIREBASE_INTEGRATION) {
      return;
    }
    
    try {
      const db = getFirestore();
      
      // Delete test user
      await db.collection('users').doc(testUserId).delete();
      
      // Delete test logs (would need a query to find all logs for this test user)
      const logs = await db.collection('emailLogs')
        .where('userId', '==', testUserId)
        .get();
      
      const batch = db.batch();
      logs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });
});