const express = require('express');
const { 
  getEmailMessage, 
  createDraftEmail, 
  updateDraftEmail,
  getConversationThread
} = require('../services/graph');

const router = express.Router();

// Get email message by ID
router.get('/:userId/messages/:messageId', async (req, res) => {
  const { userId, messageId } = req.params;
  
  try {
    const message = await getEmailMessage(userId, messageId);
    res.json(message);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ 
      error: 'Failed to fetch email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversation thread
router.get('/:userId/threads/:threadId', async (req, res) => {
  const { userId, threadId } = req.params;
  
  try {
    const thread = await getConversationThread(userId, threadId);
    res.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation thread',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create draft email (fallback mechanism)
router.post('/:userId/drafts', async (req, res) => {
  const { userId } = req.params;
  const messageData = req.body;
  
  try {
    const draft = await createDraftEmail(userId, messageData);
    res.json(draft);
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ 
      error: 'Failed to create draft email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update draft email
router.patch('/:userId/drafts/:messageId', async (req, res) => {
  const { userId, messageId } = req.params;
  const updates = req.body;
  
  try {
    const updatedDraft = await updateDraftEmail(userId, messageId, updates);
    res.json(updatedDraft);
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ 
      error: 'Failed to update draft email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;