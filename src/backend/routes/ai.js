const express = require('express');
const { generateEmailReply } = require('../services/openai');
const { getEmailMessage, getConversationThread } = require('../services/graph');
const { logEmailInteraction } = require('../services/firebase');

const router = express.Router();

// Generate AI reply for email
router.post('/reply', async (req, res) => {
  const { userId, messageId } = req.body;
  
  if (!userId || !messageId) {
    return res.status(400).json({ error: 'User ID and message ID are required' });
  }
  
  try {
    // Get the email message
    const emailData = await getEmailMessage(userId, messageId);
    
    // Get the conversation thread for context
    const threadId = emailData.conversationId;
    const emailThread = await getConversationThread(userId, threadId);
    
    // Generate AI reply
    const reply = await generateEmailReply(userId, emailData, emailThread);
    
    res.json({ reply });
  } catch (error) {
    console.error('Error generating reply:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI reply',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Log sent email
router.post('/log-sent-email', async (req, res) => {
  const { userId, messageId, originalReply, sentContent } = req.body;
  
  if (!userId || !messageId) {
    return res.status(400).json({ error: 'User ID and message ID are required' });
  }
  
  try {
    // Get the email message for metadata
    const emailData = await getEmailMessage(userId, messageId);
    
    // Log the interaction
    await logEmailInteraction(userId, messageId, {
      type: 'sentReply',
      originalAiReply: originalReply,
      sentContent: sentContent,
      subject: emailData.subject,
      recipients: emailData.toRecipients.map(r => r.emailAddress.address)
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging sent email:', error);
    res.status(500).json({ 
      error: 'Failed to log sent email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;