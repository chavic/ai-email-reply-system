# AI-Powered Email Reply System

A Node.js application that provides AI-generated replies for B2B sales representatives, integrating with Microsoft Office 365 and OpenAI.

## Overview

This system allows B2B sales representatives to quickly generate contextually relevant replies to customer emails. It integrates with Microsoft Office 365 via an Outlook Add-In and uses OpenAI's fine-tuned models to generate sales-focused responses.

### Key Features

- **AI-Generated Replies**: Fine-tuned OpenAI model generates contextually relevant email responses for B2B sales
- **Outlook Integration**: Add-In provides one-click access to AI replies directly in the Outlook compose window
- **Fallback Mechanism**: Automatic draft creation if the Add-In is unavailable
- **User Analytics**: Track and compare AI-generated replies with actually sent emails
- **Australian Data Sovereignty**: Data stored in Australian data centers for compliance

## Architecture

### Components

1. **Backend (Node.js on Google Cloud Run)**
   - Email Service: Microsoft Graph API integration
   - AI Service: OpenAI API integration
   - Authentication Service: OAuth 2.0 authentication
   - User Service: User preferences and settings

2. **Frontend**
   - Outlook Add-In: JavaScript/Office.js implementation
   - Onboarding Page: User setup and configuration

3. **Data Storage (Firebase)**
   - Firestore: User data, authentication tokens, and logs
   - Storage: Training data backup

### External Services

- **Microsoft Graph API**: Email access and manipulation
- **OpenAI API**: AI model fine-tuning and inference
- **Google Cloud Run**: Serverless hosting for backend
- **Firebase**: Database and storage

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud SDK
- Firebase CLI
- Office Add-in debugging tools

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```
4. Start the development server: `npm run dev`

### Deployment

1. Build the application: `npm run build`
2. Deploy to Google Cloud Run:
   ```
   gcloud run deploy
   ```
3. Deploy the Outlook Add-In to Microsoft AppSource or via side-loading

## Security

- OAuth 2.0 authentication with Microsoft
- HTTPS for all communications
- Firebase security rules
- Australian data hosting for compliance
- Token encryption for sensitive data

## Support

Post-deployment support provided at monthly intervals (5-10 hours per month):
- Bug fixes
- Performance optimizations
- Feature updates

## Project Timeline

- Development: 4-8 weeks
- Completion deadline: May 31, 2025
- Milestones at 25%, 50%, and 75% completion

## License

Proprietary - All rights reserved