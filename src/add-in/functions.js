// API endpoint configuration
const API_BASE_URL = 'https://your-api-domain.com/api';

// Store the original AI reply for comparison with sent email
let originalAiReply = '';

// Initialize Office.js
Office.initialize = function (reason) {
  // Add event listeners or other initialization as needed
  console.log('Add-in initialized:', reason);
};

/**
 * Generate and insert AI reply 
 * @param {Office.AddinCommands.Event} event - Office JS event
 */
function insertAIReply(event) {
  // Ensure we're in a compose form
  if (Office.context.mailbox.item.itemType !== Office.MailboxEnums.ItemType.Message) {
    showNotification('Error', 'This add-in only works with email messages');
    event.completed();
    return;
  }
  
  // Get user information from item
  const userEmail = Office.context.mailbox.userProfile.emailAddress;
  const userId = Office.context.mailbox.userProfile.accountType === 'exchangeDelegate' 
    ? Office.context.mailbox.delegateUser.userId 
    : Office.context.mailbox.userProfile.accountId;
  
  // Get the email item ID
  const itemId = Office.context.mailbox.item.itemId;
  
  // Get the conversation ID for context
  Office.context.mailbox.item.conversationId.getAsync((asyncResult) => {
    if (asyncResult.status === Office.AsyncResultStatus.Failed) {
      showNotification('Error', 'Failed to get conversation ID');
      event.completed();
      return;
    }
    
    const conversationId = asyncResult.value;
    
    // Show loading indicator
    showLoadingIndicator(true, 'Generating AI reply...');
    
    // Call API to generate reply
    fetch(`${API_BASE_URL}/ai/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        messageId: itemId,
        conversationId: conversationId,
        userEmail: userEmail
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .then(data => {
      // Store original reply for comparison
      originalAiReply = data.reply;
      
      // Insert the reply into the compose form
      Office.context.mailbox.item.body.setSelectedDataAsync(
        data.reply,
        { coercionType: Office.CoercionType.Text },
        (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            showNotification('Error', 'Failed to insert reply: ' + result.error.message);
          } else {
            // Setup event handler for when email is sent
            setupSentEmailTracking(userId, itemId, data.reply);
            
            // Show success notification
            showNotification('Success', 'AI reply inserted');
          }
          
          // Hide loading indicator
          showLoadingIndicator(false);
          
          // Complete the task
          event.completed();
        }
      );
    })
    .catch(error => {
      console.error('Error generating reply:', error);
      showNotification('Error', 'Failed to generate AI reply. Please try again.');
      showLoadingIndicator(false);
      event.completed();
    });
  });
}

/**
 * Setup tracking for when email is sent
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID
 * @param {string} aiReply - Original AI reply
 */
function setupSentEmailTracking(userId, messageId, aiReply) {
  // Add event handler for item send
  Office.context.mailbox.item.addHandlerAsync(
    Office.EventType.ItemSend,
    (eventArgs) => {
      // Get the current content of the email
      Office.context.mailbox.item.body.getAsync(
        Office.CoercionType.Text,
        (result) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const sentContent = result.value;
            
            // Log to the backend
            fetch(`${API_BASE_URL}/ai/log-sent-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: userId,
                messageId: messageId,
                originalReply: aiReply,
                sentContent: sentContent
              })
            })
            .then(response => {
              if (!response.ok) {
                console.error('Failed to log sent email');
              }
            })
            .catch(error => {
              console.error('Error logging sent email:', error);
            });
          }
        }
      );
      
      // Allow the send to continue
      eventArgs.completed({ allowEvent: true });
    }
  );
}

/**
 * Show notification in the info bar
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showNotification(title, message) {
  Office.context.mailbox.item.notificationMessages.replaceAsync(
    'aiReplyNotification',
    {
      type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
      message: message,
      icon: 'Icon.80x80',
      persistent: false
    }
  );
}

/**
 * Show or hide loading indicator
 * @param {boolean} show - Whether to show or hide
 * @param {string} message - Loading message
 */
function showLoadingIndicator(show, message = 'Loading...') {
  if (show) {
    Office.context.mailbox.item.notificationMessages.replaceAsync(
      'aiReplyLoading',
      {
        type: Office.MailboxEnums.ItemNotificationMessageType.ProgressIndicator,
        message: message,
        persistent: false
      }
    );
  } else {
    Office.context.mailbox.item.notificationMessages.removeAsync('aiReplyLoading');
  }
}

// Make functions available in global scope for Office.js
window.insertAIReply = insertAIReply;