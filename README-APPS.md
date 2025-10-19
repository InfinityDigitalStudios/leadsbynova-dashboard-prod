# Real Estate Apps - Independent Operation Guide

This monorepo contains 4 independent real estate applications that can run separately or together.

## Applications Overview

### 1. Submission Form App (Port 5001)
- **Purpose**: Lead capture form for real estate guides
- **Features**: Form validation, email integration, Google Sheets sync
- **Start**: `npm run dev:submission-form`

### 2. Chat App (Port 5002) 
- **Purpose**: Buyer-focused chat flow for lead qualification
- **Features**: Interactive chat, lead scoring, appointment scheduling
- **Start**: `npm run dev:chat`

### 3. Chat2 App (Port 5003)
- **Purpose**: Seller-focused chat flow for property selling
- **Features**: Seller questionnaire, timeline assessment, agent matching
- **Start**: `npm run dev:chat2`

### 4. Dashboard App (Port 5004)
- **Purpose**: Lead management with real-time updates
- **Features**: CRUD operations, SSE live updates, calendar integration
- **Start**: `npm run dev:dashboard`

## Running Applications

### Individual Development
```bash
# Run single app
npm run dev:submission-form  # Port 5001
npm run dev:chat            # Port 5002  
npm run dev:chat2           # Port 5003
npm run dev:dashboard       # Port 5004
```

### All Apps Development
```bash
# Run all apps simultaneously
npm run dev:all
```

### Production Builds
```bash
# Build individual apps
npm run build:submission-form
npm run build:chat
npm run build:chat2
npm run build:dashboard

# Build all apps
npm run build:all
```

### Production Start
```bash
# Start individual apps
npm run start:submission-form
npm run start:chat
npm run start:chat2
npm run start:dashboard

# Start all apps
npm run start:all
```

## Environment Configuration

Each app can run independently with its own:
- Database connection (with memory fallback)
- Port allocation
- Build configuration
- Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection (optional, falls back to memory storage)
- `PORT` - Override default port (optional)

## Architecture

```
apps/
├── submission-form/    # Lead capture form
├── chat/              # Buyer chat flow
├── chat2/             # Seller chat flow
└── dashboard/         # Lead management

packages/
└── shared/            # Shared schemas and types
```

Each app is completely independent with its own:
- `package.json` with dependencies
- Server (Express.js)
- Client (React + Vite)
- Build configuration
- Storage layer
Test deployment update.
