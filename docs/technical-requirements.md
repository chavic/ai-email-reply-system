# Technical Requirements

## Backend (Node.js on Google Cloud Run)
- **Runtime**: Node.js 18+
- **Framework**: Express.js for API endpoints
- **Deployment**: Google Cloud Run (serverless)
- **Performance**: 1-second response latency
- **Scalability**: Support for 10,000+ users, 200,000+ emails/month

## Microsoft Integration
- **Authentication**: OAuth 2.0 with Microsoft Identity Platform
- **API**: Microsoft Graph API v1.0
- **Permissions**:
  - Mail.Read
  - Mail.ReadWrite
  - Mail.Send
  - offline_access (for refresh tokens)

## OpenAI Integration
- **Model**: GPT-3.5-Turbo (fine-tuned)
- **Training**: Fine-tuned with 5,000-10,000 emails (JSONL format)
- **Token Usage**: Capacity for 40M tokens/month
- **Context**: Include email thread history for improved responses

## Firebase
- **Location**: australia-southeast1 (for data sovereignty)
- **Firestore**: 
  - User profiles and preferences
  - OAuth tokens (encrypted)
  - Email logs (AI replies and sent replies)
- **Storage**: Backup of anonymized training data
- **Capacity**: 1M+ records, indexed for performance

## Outlook Add-In
- **Framework**: Office.js
- **Compatibility**: 
  - Outlook Web
  - Outlook Desktop (Windows/Mac)
  - Outlook Mobile (iOS/Android)
- **Features**:
  - "Get AI Reply" button in reply window
  - Inline response insertion
  - Minimal UI for improved user experience

## Security Requirements
- **Authentication**: OAuth 2.0 with Microsoft 2FA
- **Data Security**: 
  - HTTPS for all communications
  - Encrypted token storage
  - Firebase security rules
- **Monitoring**: 
  - Google Cloud alerts
  - Error logging
  - Weekly backups
- **Compliance**: Australian data sovereignty

## Onboarding
- **Platform**: Carrd or equivalent lightweight frontend
- **Features**:
  - Office 365 connection via OAuth
  - Add-In installation instructions
  - Notification preferences
  - Support information