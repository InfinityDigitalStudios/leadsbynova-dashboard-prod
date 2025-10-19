# Real Estate Lead Generation Form

## Overview

This is a LeadsByNova dashboard application with comprehensive pipeline management, TCPA-compliant consent record tracking, and contextual help tooltips. The system features mobile-optimized lead cards, immutable consent records database with full compliance metadata (SHA-256 hashing, version tracking, source URLs, channel information), and a search-enabled Active Leads section. Built with fork-based multi-tenant architecture where each client fork has isolated database and configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** as the build tool and development server for fast hot module replacement
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query** for server state management and API calls
- **React Hook Form** with Zod validation for robust form handling
- **Tailwind CSS** with custom CSS variables for styling
- **Shadcn/ui** component library built on Radix UI primitives for accessible, customizable components

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with a single `/api/form-submission` endpoint
- **In-memory storage** with abstract storage interface allowing easy migration to database solutions
- **Middleware** for request logging, JSON parsing, and error handling
- **Hot reload** development setup with proper static file serving

### Database Schema
- **Drizzle ORM** configured for PostgreSQL with type-safe database operations
- **Lead management** with comprehensive tracking of form submissions, chat interactions, and pipeline status
  - **LeadsByNova chat fields** - userType, mainGoal, leadManagement, timeline, communicationPreference (active)
  - **Legacy real estate fields** - prequalified, moveTimeline, budgetRange, etc. (kept for backwards compatibility but not used in this fork)
- **Consent records** - Immutable TCPA compliance system with SHA-256 hash verification, source URL tracking, and full audit trail
- **Form submissions** track: full name, email, phone, guide type, and creation timestamp
- **UUID primary keys** with PostgreSQL's `gen_random_uuid()` function
- **Zod schemas** for runtime validation matching database constraints

### Validation & Type Safety
- **Shared schema definitions** between frontend and backend using Drizzle-Zod
- **Runtime validation** on both client and server sides
- **TypeScript** throughout the entire stack for compile-time type checking
- **Form validation** with proper error messages and user feedback
- **Environment validation** with comprehensive fork isolation checks and helpful error messages

### Fork-Based Multi-Tenant Architecture
- **Fork isolation** - Each client gets their own fork with isolated database, configuration, and user accounts
- **Client credentials** - Environment variable-based setup for client login credentials (`CLIENT_EMAIL`, `CLIENT_PASSWORD`, `CLIENT_NAME`)
- **Automatic user initialization** - Client owner accounts automatically created on first startup
- **Admin access** - Separate superadmin account for platform management (`ADMIN_PASSWORD`)
- **Fork validation** - Prevents database sharing between forks with detailed validation warnings
- **Environment variable configuration** - All fork-specific settings configured via environment variables (`FORK_ID`, `DATABASE_URL`, `EMAIL_TO`)
- **FORK_SETUP_GUIDE.md** - Comprehensive setup guide for creating new client forks

### External Integrations
- **Google Sheets API** integration for automatic lead export
- **Service account authentication** for secure Google Sheets access
- **Configurable spreadsheet** targeting via environment variables
- **Graceful fallback** when Google Sheets credentials are not configured
- **Email system** using Nodemailer/Gmail for automated guide delivery and lead notifications
  - **Configuration via environment variables** - No database appConfig table used; all settings via EMAIL_USER, EMAIL_PASS, EMAIL_TO
  - **LeadsByNova-specific templates** - Agent notifications display userType, mainGoal, leadManagement, timeline, and communicationPreference
  - **2-minute delay logic** - Emails sent 2 minutes after form submission OR immediately when chat completes/abandons
  - **Call booking integration** - Automatically includes scheduled call details when booked within 2-minute window
  - **Dual notification system** - Welcome email to lead AND agent notification to EMAIL_TO address
- **Real-time appointment scheduling** with proper data capture and email integration

### TCPA Compliance System
- **Frontend SHA-256 hashing** - Cryptographic verification of consent disclosure text using Web Crypto API
- **Source URL capture** - Exact page URL (`window.location.href`) where consent was obtained
- **Disclosure versioning** - Version tracking for consent text changes over time
- **Tamper-resistant records** - SHA-256 hash stored with first 12 characters for receipt display
- **Complete audit trail** - IP address, user agent, sender name, channels consented, and UTC timestamps
- **Immutable consent records** - Separate database table that survives lead deletion for legal compliance
- **Printable receipts** - Professional compliance documentation with all verification fields
- **Exact text matching** - Consent text in database matches exactly what user saw on form

### UI/UX Design
- **Responsive design** with mobile-first approach
- **Loading states** and success/error feedback for form submissions
- **Accessible components** using Radix UI primitives
- **Professional styling** with a real estate business theme
- **Toast notifications** for user feedback
- **Automatic redirection** to a "coming soon" chat page after successful submission

## External Dependencies

### Core Framework Dependencies
- **React 18** with React DOM for the frontend framework
- **Express.js** for the backend server
- **TypeScript** for type safety across the entire application
- **Vite** for fast development and optimized production builds

### Database & ORM
- **Drizzle ORM** for type-safe database operations
- **@neondatabase/serverless** for PostgreSQL database connectivity
- **Drizzle-Kit** for database migrations and schema management

### UI Components & Styling
- **Tailwind CSS** for utility-first styling
- **Radix UI** component primitives for accessibility
- **Shadcn/ui** component library
- **Lucide React** for consistent iconography
- **Class Variance Authority** for component variant management

### Form Handling & Validation
- **React Hook Form** for performant form management
- **Zod** for schema validation
- **@hookform/resolvers** for Zod integration with React Hook Form

### State Management & API
- **TanStack React Query** for server state management
- **Wouter** for lightweight client-side routing

### External Services
- **Google APIs** for Google Sheets integration
- **Connect-pg-simple** for PostgreSQL session storage (configured but not actively used)

### Development Tools
- **ESBuild** for fast production builds
- **PostCSS** with Autoprefixer for CSS processing
- **Various Replit plugins** for development environment integration