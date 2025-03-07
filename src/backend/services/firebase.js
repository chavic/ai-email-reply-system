const admin = require('firebase-admin');

let firebaseInitialized = false;

/**
 * Initialize Firebase with admin credentials
 */
function initializeFirebase() {
  if (firebaseInitialized) {
    return;
  }

  // Check if running in GCP environment or locally
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Use service account from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    } else {
      // Default application credentials when running on GCP
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        locationId: 'australia-southeast1' // Australian data sovereignty
      });
    }
    
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
function getFirestore() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Get Firebase storage instance
 */
function getStorage() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin.storage();
}

/**
 * Store user token in Firestore
 * @param {string} userId - Microsoft user ID
 * @param {object} tokens - OAuth tokens
 */
async function storeUserTokens(userId, tokens) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Encrypt sensitive data in production
  await userRef.set({
    tokens: tokens,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  return true;
}

/**
 * Get user tokens from Firestore
 * @param {string} userId - Microsoft user ID
 */
async function getUserTokens(userId) {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return null;
  }
  
  return userDoc.data().tokens;
}

/**
 * Log email interactions
 * @param {string} userId - Microsoft user ID
 * @param {string} emailId - Email ID
 * @param {object} data - Log data
 */
async function logEmailInteraction(userId, emailId, data) {
  const db = getFirestore();
  const logRef = db.collection('emailLogs').doc();
  
  await logRef.set({
    userId,
    emailId,
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return logRef.id;
}

/**
 * Update user preferences
 * @param {string} userId - Microsoft user ID
 * @param {object} preferences - User preferences
 */
async function updateUserPreferences(userId, preferences) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  await userRef.set({
    preferences,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  return true;
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorage,
  storeUserTokens,
  getUserTokens,
  logEmailInteraction,
  updateUserPreferences
};