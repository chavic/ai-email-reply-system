const admin = require('firebase-admin');
const {
  initializeFirebase,
  getFirestore,
  getStorage,
  storeUserTokens,
  getUserTokens,
  logEmailInteraction,
  updateUserPreferences
} = require('../../../src/backend/services/firebase');

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' } })
    })
  };
  
  const mockStorage = {
    bucket: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue([{ name: 'test-file' }])
  };
  
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    },
    firestore: jest.fn().mockReturnValue(mockFirestore),
    storage: jest.fn().mockReturnValue(mockStorage),
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn().mockReturnValue('server-timestamp')
      }
    }
  };
});

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset initialization flag
    // This is a bit of a hack to reset the module state
    const firebaseModule = require('../../../src/backend/services/firebase');
    firebaseModule.firebaseInitialized = false;
  });
  
  describe('initializeFirebase', () => {
    it('should initialize Firebase with service account', () => {
      // Mock environment variables
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ type: 'service_account' });
      process.env.FIREBASE_DATABASE_URL = 'https://test.firebaseio.com';
      process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
      
      // Call the function
      initializeFirebase();
      
      // Assertions
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: expect.any(Function),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    });
    
    it('should initialize Firebase with default credentials', () => {
      // Mock environment variables
      delete process.env.FIREBASE_SERVICE_ACCOUNT;
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
      
      // Call the function
      initializeFirebase();
      
      // Assertions
      expect(admin.initializeApp).toHaveBeenCalledWith({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        locationId: 'australia-southeast1'
      });
    });
    
    it('should only initialize Firebase once', () => {
      // Call the function twice
      initializeFirebase();
      initializeFirebase();
      
      // Assertions
      expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getFirestore', () => {
    it('should return Firestore instance', () => {
      // Call the function
      const db = getFirestore();
      
      // Assertions
      expect(db).toBeDefined();
      expect(admin.firestore).toHaveBeenCalled();
    });
    
    it('should initialize Firebase if not already initialized', () => {
      // Call the function
      getFirestore();
      
      // Assertions
      expect(admin.initializeApp).toHaveBeenCalled();
    });
  });
  
  describe('getStorage', () => {
    it('should return Storage instance', () => {
      // Call the function
      const storage = getStorage();
      
      // Assertions
      expect(storage).toBeDefined();
      expect(admin.storage).toHaveBeenCalled();
    });
  });
  
  describe('storeUserTokens', () => {
    it('should store user tokens in Firestore', async () => {
      // Mock tokens
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresOn: new Date()
      };
      
      // Call the function
      const result = await storeUserTokens('test-user-id', tokens);
      
      // Assertions
      expect(result).toBe(true);
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().doc).toHaveBeenCalledWith('test-user-id');
      expect(admin.firestore().set).toHaveBeenCalledWith({
        tokens,
        updatedAt: 'server-timestamp'
      }, { merge: true });
    });
  });
  
  describe('getUserTokens', () => {
    it('should retrieve user tokens from Firestore', async () => {
      // Call the function
      const tokens = await getUserTokens('test-user-id');
      
      // Assertions
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBe('test-token');
      expect(tokens.refreshToken).toBe('test-refresh');
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().doc).toHaveBeenCalledWith('test-user-id');
      expect(admin.firestore().get).toHaveBeenCalled();
    });
    
    it('should return null if user document does not exist', async () => {
      // Mock document not existing
      admin.firestore().get.mockResolvedValueOnce({
        exists: false
      });
      
      // Call the function
      const tokens = await getUserTokens('non-existent-user');
      
      // Assertions
      expect(tokens).toBeNull();
    });
  });
  
  describe('logEmailInteraction', () => {
    it('should log email interaction in Firestore', async () => {
      // Mock data
      const data = {
        type: 'aiReply',
        model: 'gpt-3.5-turbo',
        subject: 'Test Email'
      };
      
      // Call the function
      const logId = await logEmailInteraction('test-user-id', 'email-123', data);
      
      // Assertions
      expect(logId).toBeDefined();
      expect(admin.firestore().collection).toHaveBeenCalledWith('emailLogs');
      expect(admin.firestore().set).toHaveBeenCalledWith({
        userId: 'test-user-id',
        emailId: 'email-123',
        ...data,
        timestamp: 'server-timestamp'
      });
    });
  });
  
  describe('updateUserPreferences', () => {
    it('should update user preferences in Firestore', async () => {
      // Mock preferences
      const preferences = {
        notifications: true
      };
      
      // Call the function
      const result = await updateUserPreferences('test-user-id', preferences);
      
      // Assertions
      expect(result).toBe(true);
      expect(admin.firestore().collection).toHaveBeenCalledWith('users');
      expect(admin.firestore().doc).toHaveBeenCalledWith('test-user-id');
      expect(admin.firestore().set).toHaveBeenCalledWith({
        preferences,
        updatedAt: 'server-timestamp'
      }, { merge: true });
    });
  });
});