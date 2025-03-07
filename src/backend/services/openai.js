const { OpenAI } = require('openai');
const { logEmailInteraction } = require('./firebase');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Get the fine-tuned model name based on environment
 */
function getFineTunedModel() {
  return process.env.OPENAI_FINE_TUNED_MODEL || 'gpt-3.5-turbo';
}

/**
 * Format email thread for AI context
 * @param {Array} emailThread - Array of email messages
 */
function formatEmailThreadForContext(emailThread) {
  if (!emailThread || !emailThread.value) {
    return '';
  }
  
  return emailThread.value.map(email => {
    return `From: ${email.sender.emailAddress.name} <${email.sender.emailAddress.address}>
To: ${email.toRecipients.map(r => `${r.emailAddress.name} <${r.emailAddress.address}>`).join(', ')}
Subject: ${email.subject}
Date: ${new Date(email.receivedDateTime).toISOString()}

${email.bodyPreview || email.body.content}

-------------------
`;
  }).join('\n');
}

/**
 * Generate AI email reply
 * @param {string} userId - Microsoft user ID
 * @param {object} emailData - Email data
 * @param {object} emailThread - Email thread data
 */
async function generateEmailReply(userId, emailData, emailThread) {
  try {
    const model = getFineTunedModel();
    const threadContext = formatEmailThreadForContext(emailThread);
    
    const systemPrompt = `You are an AI assistant for a B2B sales representative in the business equipment industry. 
Generate a professional, concise reply to the email. Focus on:
1. Maintaining a sales-oriented approach
2. Addressing specific questions or concerns from the customer
3. Including relevant details like pricing (e.g., "$2,000 with leasing options")
4. Providing next steps when appropriate
5. Using a professional but friendly tone
6. Being concise and to the point`;
    
    const userPrompt = `Please generate a reply to the following email thread:

${threadContext}

The original email subject is: ${emailData.subject}

When generating the reply:
- Do not include salutations like "Dear" or sign-offs like "Best regards"
- Only generate the body text of the reply
- Keep it under 200 words
- Focus on moving the sales process forward`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const generatedReply = completion.choices[0].message.content.trim();
    
    // Log the interaction
    await logEmailInteraction(userId, emailData.id, {
      type: 'aiReply',
      model: model,
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens,
      subject: emailData.subject
    });
    
    return generatedReply;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Create fine-tuned model
 * @param {string} trainingFileId - OpenAI file ID for training data
 */
async function createFineTunedModel(trainingFileId) {
  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: 'gpt-3.5-turbo',
      suffix: 'b2b-sales-email-replies'
    });
    
    return fineTune;
  } catch (error) {
    console.error('Fine-tuning error:', error);
    throw error;
  }
}

/**
 * Upload training file to OpenAI
 * @param {string} filePath - Path to training file
 */
async function uploadTrainingFile(filePath) {
  try {
    const file = await openai.files.create({
      file: filePath,
      purpose: 'fine-tune'
    });
    
    return file;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

module.exports = {
  generateEmailReply,
  createFineTunedModel,
  uploadTrainingFile
};