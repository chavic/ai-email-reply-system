# AI-Powered Email Reply System - Architecture

## System Overview
This system provides AI-generated replies for B2B sales representatives in the business equipment industry.

## Components

### 1. Backend (Node.js on Google Cloud Run)
- **Email Service**: Interfaces with Microsoft Graph API
- **AI Service**: Manages OpenAI API interactions and fine-tuned model
- **Authentication Service**: Handles OAuth 2.0 for Microsoft 365
- **Logger Service**: Records system activity and email metrics

### 2. Frontend
- **Outlook Add-In**: JavaScript/Office.js implementation for web/desktop/mobile
- **Onboarding Page**: Simple Carrd interface for user setup

### 3. Data Storage (Firebase)
- **Firestore**: User preferences, authentication tokens, logs
- **Storage**: Backup of training data

### 4. External Services
- **Microsoft Graph API**: Email access and manipulation
- **OpenAI API**: AI model fine-tuning and inference
- **Google Cloud Run**: Serverless hosting

## Data Flow
1. User clicks "Get AI Reply" in Outlook
2. Add-In calls backend API
3. Backend retrieves email context via Graph API
4. Backend generates reply using fine-tuned OpenAI model
5. Reply inserted into email composition window
6. System logs both AI reply and final sent email

## Fallback Mechanism
If Add-In is blocked/unavailable, system uses Graph API to create draft emails directly.

## Security
- OAuth 2.0 for Microsoft authentication
- HTTPS for all communications
- Firebase security rules and IAM
- Encrypted data transfer
- Australian data sovereignty compliance