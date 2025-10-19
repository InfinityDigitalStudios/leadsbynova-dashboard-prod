# LeadsByNova Technical Architecture Summary

## Overview
LeadsByNova is a comprehensive lead generation and pipeline management system built as a dual-purpose application: it serves as the production backend for LeadsByNova AND as a master template for creating isolated client forks. The system features form submission, AI-powered chat engagement, Zoom-only demo booking, and full TCPA compliance tracking.

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (for fast HMR and optimized builds)
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query v5 (server state management)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Shadcn/ui (built on Radix UI primitives)
- **Styling**: Tailwind CSS with custom CSS variables
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Validation**: Zod schemas (shared between frontend/backend)
- **Session Management**: Express-session with PostgreSQL store

### External Integrations
- **Email**: Nodemailer/Gmail + SendGrid support
- **Google Sheets**: API integration for lead export
- **OpenAI**: Chat engagement (configured but not actively used)

## System Architecture

### Fork-Based Multi-Tenant Architecture
The application uses a unique fork isolation system where:
- Each client gets their own fork with isolated database and configuration
- Fork validation prevents database sharing between different forks
- Environment variables control fork identity (FORK_ID, DATABASE_URL, CLIENT_EMAIL, etc.)
- Master build (FORK_ID: infinitydigitalstudios) serves as both production and template

### Key Architectural Principles
1. **Frontend-Heavy**: Most logic lives in the frontend; backend handles persistence and external API calls
2. **Shared Types**: All database schemas and validation types are shared via `shared/schema.ts`
3. **Configuration-Driven**: Almost everything is customizable via the `/configuration` page
4. **Immutable Compliance**: TCPA consent records are never deleted, even when leads are removed

## Database Schema

### Core Tables

#### `leads` - Primary lead tracking
```typescript
- id (uuid, primary key)
- fullName, email, phone
- guideType (legacy field, not used in LeadsByNova fork)
- source (form, chat)
- status (new, contacted, qualified, demo_scheduled, won, lost, nurture)
- pipelineStage (active_leads, scheduled_demos, won_deals, lost_deals)
- userType, mainGoal, leadManagement, timeline, communicationPreference (LeadsByNova chat fields)
- ownerId (assigned agent)
- createdAt, updatedAt
```

#### `consentRecords` - TCPA compliance (immutable)
```typescript
- id (uuid, primary key)
- leadId (references leads, cascade delete NOT set - survives lead deletion)
- consentText (exact text shown to user)
- consentTextHash (SHA-256 hash for verification)
- consentVersion (tracking version changes)
- sourceUrl (exact page URL where consent was obtained)
- ipAddress, userAgent
- channel (sms, email, phone)
- senderName (who will contact them)
- smsPrivacyUrl, smsTermsUrl, emailPrivacyUrl, emailTermsUrl
- consentedAt (UTC timestamp)
```

#### `chatMessages` - Conversation history
```typescript
- id (uuid)
- leadId (references leads)
- role (user, assistant, system)
- content (message text)
- createdAt
```

#### `chatSessions` - Session tracking
```typescript
- id (uuid)
- leadId (references leads)
- status (active, completed, abandoned)
- startedAt, completedAt
```

#### `scheduledCalls` - Demo bookings
```typescript
- id (uuid)
- leadId (references leads)
- scheduledDate, scheduledTime
- zoomLink, status
- createdAt
```

#### `appConfig` - Dynamic configuration
```typescript
- id (uuid)
- key (unique identifier)
- value (JSON string)
- label, description
- category (guides, agents, branding, email, legal)
- displayOrder
```

#### `users` - Authentication and RBAC
```typescript
- id (uuid)
- email (unique)
- password (bcrypt hashed)
- name
- role (owner, agent, viewer)
- createdAt
```

#### `tenantMetadata` - Fork isolation tracking
```typescript
- id (uuid)
- forkId (unique)
- databaseUrl
- emailTo
- description
- isActive
- createdAt, lastValidatedAt
```

### Important Schema Notes
1. **Legacy real estate fields** exist but are NOT used in LeadsByNova fork (prequalified, moveTimeline, budgetRange)
2. **Consent records survive lead deletion** for compliance requirements
3. **All primary keys use PostgreSQL's gen_random_uuid()**
4. **Array columns** use `.array()` method syntax: `text().array()` not `array(text())`

## Frontend Structure

### Key Pages
- `/` - Dashboard (main lead pipeline view)
- `/submission-form` - Public lead capture form
- `/chat` - AI-powered chat engagement
- `/configuration` - Admin configuration panel
- `/login` - Authentication

### Important Components

#### `PreviewListener.tsx`
- Listens for postMessage events from configuration page
- Updates live preview in real-time as admin edits settings
- Uses data-config-key attributes to identify updateable elements

#### Dashboard Lead Cards
- Mobile-optimized design
- Color-coded by pipeline stage
- Quick actions (edit, delete, move stages, schedule demo)
- Real-time updates via Server-Sent Events (SSE)

#### Configuration System
- Upload images for branding
- Customize colors (primary, secondary)
- Edit guide options (up to 4)
- Manage agents with headshots
- Configure SMS/Email opt-in text and Privacy/Terms URLs
- Live preview updates without page refresh

### Frontend Conventions
1. **No explicit React imports** - Vite JSX transformer handles it
2. **Environment variables** must be prefixed with `VITE_` to be accessible in frontend
3. **TanStack Query v5** uses object form: `useQuery({ queryKey: ['key'] })`
4. **Form validation** uses zodResolver with Drizzle-Zod insert schemas
5. **data-testid attributes** on all interactive and meaningful display elements
6. **queryKey arrays** use segments for hierarchical cache invalidation: `['/api/leads', id]`

## Backend Structure

### Storage Interface (`server/storage.ts`)
All database operations go through IStorage interface:
```typescript
interface IStorage {
  // Leads
  createLead(data: InsertLead): Promise<Lead>
  getLeads(filters?: LeadFilters): Promise<Lead[]>
  updateLead(id: string, data: Partial<Lead>): Promise<Lead>
  deleteLead(id: string): Promise<void>
  
  // Consent records
  createConsentRecord(data: InsertConsentRecord): Promise<ConsentRecord>
  getConsentRecordsByLeadId(leadId: string): Promise<ConsentRecord[]>
  
  // Configuration
  getConfigs(): Promise<AppConfig[]>
  updateConfig(id: string, value: string): Promise<AppConfig>
  
  // Users
  getUserByEmail(email: string): Promise<User | null>
  
  // And more...
}
```

### API Routes (`server/routes.ts`)
Key endpoints:
- `POST /api/form-submission` - Public form submission with TCPA consent
- `GET/POST /api/leads` - Lead CRUD with RBAC filtering
- `POST /api/chat/message` - AI chat interaction
- `POST /api/schedule-call` - Zoom demo booking
- `GET/PUT /api/app-config` - Configuration management
- `POST /api/auth/login` - Authentication
- `POST /api/upload-image` - Image upload for branding/agents

### Important Backend Rules
1. **Validate all request bodies** using Zod schemas before passing to storage
2. **Keep routes thin** - business logic belongs in storage layer
3. **RBAC enforcement** - owners see all leads, agents see only assigned leads, viewers read-only
4. **2-minute email delay** - Welcome emails sent 2 min after form OR immediately when chat completes/abandons
5. **Immutable consent records** - NEVER delete, only create

## Authentication & Authorization

### User Roles
- **owner**: Full access to everything
- **agent**: Can view assigned leads, update them, schedule demos
- **viewer**: Read-only access

### RBAC Implementation
```typescript
// Filter leads based on user role
if (user.role === 'agent') {
  return leads.filter(lead => lead.ownerId === user.id)
}
// Owners and viewers see all leads
```

### Session Management
- Express-session with PostgreSQL store
- Session secret from environment variable
- httpOnly cookies
- 7-day session lifetime

## Key Features

### Form Submission Flow
1. User fills out form with name, email, phone, guide selection
2. User checks SMS/Email opt-in boxes (optional)
3. User reviews and accepts TCPA consent disclosure
4. Frontend generates SHA-256 hash of consent text
5. Backend creates lead + consent record atomically
6. Welcome email sent to lead (2-min delay OR immediate if chat completes)
7. Agent notification email sent to EMAIL_TO address
8. Redirect to `/chat` page

### Chat Engagement Flow
1. Chat session created when user lands on `/chat`
2. OpenAI integration asks qualification questions
3. Messages stored in chatMessages table
4. Session marked completed/abandoned based on user behavior
5. Email notifications triggered when chat ends

### Demo Booking Flow
1. User selects date/time from available slots
2. Zoom link auto-generated (or manual entry)
3. Scheduled call record created
4. If booked within 2-min window, details included in welcome email
5. Calendar integration possible but not implemented

### TCPA Compliance System
- **SHA-256 hashing** - Frontend generates cryptographic hash of consent disclosure
- **Source URL capture** - Exact page URL where consent obtained
- **Disclosure versioning** - Track changes to consent text over time
- **Immutable records** - Consent records survive lead deletion
- **Complete audit trail** - IP, user agent, timestamp, channels, sender name
- **Printable receipts** - Professional compliance documentation
- **Dynamic disclosure building** - Text constructed from configurable Privacy/Terms URLs

### Email Notification System
- **Welcome email to lead** - Sent 2 minutes after form OR immediately when chat completes
- **Agent notification** - Sent to EMAIL_TO with lead details
- **LeadsByNova templates** - Display userType, mainGoal, leadManagement, timeline, communicationPreference
- **Call booking integration** - Includes scheduled call details if booked in 2-min window
- **Dual send** - Both welcome and notification go out together

### Configuration System
All settings stored in `appConfig` table with categories:
- **guides**: Up to 4 customizable guide options
- **agents**: Team members with names, emails, headshots
- **branding**: Colors, logo, company name
- **email**: From address, SMTP settings
- **legal**: SMS/Email opt-in text, Privacy/Terms URLs

## Environment Variables

### Required
```bash
FORK_ID=infinitydigitalstudios              # Unique fork identifier
DATABASE_URL=postgresql://...                # PostgreSQL connection string
EMAIL_TO=chris@infinitydigitalstudios.com   # Agent notification recipient
CLIENT_EMAIL=chris@infinitydigitalstudios.com
CLIENT_PASSWORD=SecurePassword123
```

### Optional
```bash
FORK_DESCRIPTION="LeadsByNova - Production"
NODE_ENV=development|production
PORT=5000
ADMIN_PASSWORD=SecureAdminPassword
CLIENT_NAME=LeadsByNova

# Email sending
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SENDGRID_API_KEY=your-sendgrid-key

# Google Sheets export
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SPREADSHEET_ID=...
```

### Development Overrides (NEVER in production)
```bash
OVERRIDE_ALLOW_SHARED_DB=true
CONFIRM_SHARED_DB_RISK=I_UNDERSTAND_DATA_ISOLATION_RISK
```

## Fork Validation System

### Startup Validation
On every server start:
1. Validate environment variables (format, required fields)
2. Connect to database and create/check `tenant_metadata` table
3. Verify fork_id + database_url mapping
4. Prevent database sharing between forks
5. Block if validation fails with clear error messages

### Validation Rules
- Each FORK_ID must map to exactly one DATABASE_URL
- Each DATABASE_URL can only be used by one FORK_ID
- EMAIL_TO drift detection and auto-update
- Development bypass requires NODE_ENV=development + double confirmation

## Development Workflow

### Database Migrations
```bash
npm run db:push              # Push schema changes to database
npm run db:push --force      # Force push if data loss warning
```

Never write manual SQL migrations - use Drizzle's push system.

### Running the Application
```bash
npm run dev                  # Starts Express + Vite dev server
```
- Backend runs on port 5000
- Frontend served by Vite, proxied through Express
- Single port for both frontend/backend

### File Organization Rules
1. **Minimize files** - Collapse similar components into single files
2. **Shared types** - Always define in `shared/schema.ts` first
3. **No Vite modifications** - Never edit `vite.config.ts` or `server/vite.ts`
4. **No package.json edits** - Use packager tool for dependencies

## Important Code Conventions

### Drizzle Schema
```typescript
// ✅ CORRECT
export const myTable = pgTable('my_table', {
  tags: text('tags').array()
})

// ❌ WRONG
export const myTable = pgTable('my_table', {
  tags: array(text('tags'))
})
```

### Insert Schemas
```typescript
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type InsertLead = z.infer<typeof insertLeadSchema>
export type Lead = typeof leads.$inferSelect
```

### Form Validation
```typescript
const form = useForm<InsertLead>({
  resolver: zodResolver(insertLeadSchema.extend({
    email: z.string().email("Valid email required")
  })),
  defaultValues: { fullName: '', email: '', phone: '' }
})
```

### TanStack Query
```typescript
// ✅ CORRECT - Object form
const { data } = useQuery({ 
  queryKey: ['/api/leads', leadId] 
})

// ✅ CORRECT - Mutation with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/leads', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/leads'] })
  }
})

// ❌ WRONG - Array form (TanStack Query v4 syntax)
const { data } = useQuery(['/api/leads'])
```

## Deployment Notes

### Replit Deployment Types
- **Autoscale**: Sleeps after 15 min inactivity, slow cold starts
- **Reserved VM**: Always-on, $20/month for 0.5 vCPU
- **Static**: For static sites only, not applicable to this backend

### Production Checklist
1. Set NODE_ENV=production
2. Configure all required environment variables
3. Verify DATABASE_URL points to production database
4. Set strong CLIENT_PASSWORD and ADMIN_PASSWORD
5. Configure email sending (Gmail or SendGrid)
6. Test fork validation on startup
7. Verify TCPA consent records are being created
8. Check email notifications are sending

## Security Considerations

1. **Never expose secrets** in code or logs
2. **Hash passwords** with bcrypt (10 rounds)
3. **Validate all inputs** with Zod schemas
4. **RBAC on all endpoints** - check user.role before data access
5. **SQL injection protection** - Use Drizzle ORM parameterized queries
6. **Session security** - httpOnly cookies, secure in production
7. **Database isolation** - Fork validation prevents cross-contamination
8. **Immutable compliance** - Consent records never deleted

## Known Quirks & Gotchas

1. **SelectItem requires value prop** - Will throw error without it
2. **useToast** exports from `@/hooks/use-toast` not `@/components/ui/toast`
3. **Form errors not visible** - Check `form.formState.errors` for hidden validation issues
4. **Environment variables** - Must prefix with `VITE_` for frontend access
5. **Empty guide options filtered** - Blank options don't display on form
6. **Privacy/Terms URLs** - If not set, modal buttons appear; if set, become clickable links
7. **2-minute email delay** - Can be confusing, check chat completion to trigger immediate send
8. **Legacy real estate fields** - Present in schema but not used in LeadsByNova fork

## Testing & Debugging

### Log Locations
- Workflow logs: `/tmp/logs/Start_application_<timestamp>.log`
- Browser console: `/tmp/logs/browser_console_<timestamp>.log`

### Common Issues
- **Form not submitting**: Check form.formState.errors
- **Emails not sending**: Verify GMAIL_USER and GMAIL_APP_PASSWORD
- **RBAC not working**: Check user.role and ownerId assignment
- **Database conflicts**: Verify FORK_ID and DATABASE_URL mapping

## Client Fork Setup Process

1. Fork the repository in Replit or GitHub
2. Create new PostgreSQL database (Neon, Supabase, etc.)
3. Copy `.env.example` to `.env`
4. Set required variables:
   - FORK_ID (unique identifier)
   - DATABASE_URL (new database connection)
   - CLIENT_EMAIL (client's login email)
   - CLIENT_PASSWORD (strong password for client)
   - EMAIL_TO (where to send lead notifications)
5. Run `npm install`
6. Run `npm run dev`
7. Fork validation will auto-create client owner account
8. Provide credentials to client for first login

## Summary

LeadsByNova is a production-grade lead generation system with:
- Complete TCPA compliance tracking
- AI-powered chat engagement
- Zoom-only demo booking
- Full pipeline management
- Fork-based multi-tenancy
- Mobile-optimized UI
- Real-time updates
- Configurable branding and workflows

The codebase follows modern TypeScript/React best practices with comprehensive type safety, shared schemas between frontend/backend, and a focus on frontend-heavy architecture with backend handling only persistence and external API calls.
