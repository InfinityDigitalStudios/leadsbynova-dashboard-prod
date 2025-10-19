# Fork Setup Guide

This guide explains how to set up your own isolated fork of the real estate lead generation application. Each fork operates independently with its own database and email configuration.

## 🚀 Quick Start

1. **Fork this repository** to your own account
2. **Create a database** for your fork (see Database Setup below)
3. **Copy environment template**: `cp .env.example .env`
4. **Fill in your environment variables** (see Configuration below)
5. **Start the application**: The validation system will guide you if anything is missing

## 🔒 Why Fork Isolation Matters

Each fork must be completely isolated to prevent:
- **Data leakage**: Your leads appearing in other people's dashboards
- **Email confusion**: Notifications going to the wrong person
- **Database conflicts**: Multiple forks sharing the same data

The application includes built-in validation to prevent these issues.

## 📋 Required Configuration

### 1. Fork Identity (`FORK_ID`)

Choose a unique identifier for your fork:

```bash
# Examples of good FORK_IDs
FORK_ID=my-realestate-app
FORK_ID=tampa-properties
FORK_ID=johns-lead-gen
```

**Rules:**
- Only letters, numbers, hyphens, and underscores
- Maximum 50 characters
- Must be unique across all forks

### 2. Database Setup (`DATABASE_URL`)

Each fork **MUST** have its own separate database. Never share databases between forks.

#### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project for your fork
3. Copy the connection string
4. Set `DATABASE_URL=postgresql://...`

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string
4. Set `DATABASE_URL=postgresql://...`

#### Option C: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb my_fork_db`
3. Set `DATABASE_URL=postgresql://localhost:5432/my_fork_db`

### 3. Email Notifications (`EMAIL_TO`)

Set the email address that will receive lead notifications:

```bash
EMAIL_TO=your-email@domain.com
```

**Important:** Each fork should use a different email address to prevent confusion.

### 4. Client Credentials (Required for Client Login)

**IMPORTANT:** Since you're setting up forks for clients, you need to configure their login credentials:

```bash
# Client's login email (required)
CLIENT_EMAIL=client@example.com

# Client's initial password (required, min 8 characters)
CLIENT_PASSWORD=SecurePassword123

# Client's name (optional, for records)
CLIENT_NAME=John Smith Real Estate
```

**What happens when you set these:**
- A client owner account is automatically created when the fork starts
- The client can log in with `CLIENT_EMAIL` and `CLIENT_PASSWORD`
- They have full owner access to their dashboard and leads
- You should provide these credentials to your client after setup

**Best Practices:**
- Generate a strong password for `CLIENT_PASSWORD`
- Recommend the client change their password after first login
- Document these credentials securely for the client
- Each fork should have unique client credentials

**Your Admin Access (Optional):**
```bash
# Your admin password for platform management (optional)
ADMIN_PASSWORD=YourSecureAdminPassword
```

The admin account `admin@leadsbynova.com` is created for you to manage the platform. If you don't set `ADMIN_PASSWORD`, it defaults to "change-me-immediately".

## ⚙️ Environment Configuration

### Step 1: Copy the Template

```bash
cp .env.example .env
```

### Step 2: Fill in Required Values

Edit `.env` and set these required variables:

```bash
# Your unique fork identifier
FORK_ID=client-name-2024

# Your private database (never share this!)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Your email for lead notifications  
EMAIL_TO=your-email@domain.com

# Client login credentials (REQUIRED for client access)
CLIENT_EMAIL=client@theirdomain.com
CLIENT_PASSWORD=GeneratedSecurePassword123
CLIENT_NAME=Client Company Name
```

### Step 3: Optional Configuration

```bash
# Description of your fork
FORK_DESCRIPTION="Client Name - Real Estate Lead Dashboard"

# Your admin password for platform management
ADMIN_PASSWORD=YourSecureAdminPassword

# Application environment
NODE_ENV=development

# Port (default: 5000)
PORT=5000
```

## 🚀 Starting Your Fork

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```

3. **Follow validation guidance:**
   If any configuration is missing or invalid, the application will show clear instructions on how to fix it.

## ✅ Validation System

The application includes comprehensive validation that checks:

- ✅ **Fork ID**: Present, unique, and properly formatted
- ✅ **Database URL**: Valid PostgreSQL connection, unique per fork
- ✅ **Email**: Valid format for lead notifications
- ✅ **Isolation**: Prevents database sharing between forks

## 🔧 Troubleshooting

### Error: "FORK_ID environment variable is required"
**Solution:** Set a unique `FORK_ID` in your `.env` file:
```bash
FORK_ID=my-realestate-app
```

### Error: "DATABASE_URL must be a valid URL"
**Solutions:**
- Check your database connection string format
- Ensure it starts with `postgresql://` or `postgres://`
- Verify your database credentials are correct

### Error: "Fork ID is already registered with a different DATABASE_URL"
**Solution:** This means you're trying to reuse a `FORK_ID` with a different database. Either:
- Choose a different, unique `FORK_ID`
- Use the same database as the original fork (not recommended)

### Error: "DATABASE_URL is already in use by another fork"
**Solution:** Each fork needs its own database. Create a new database and update your `DATABASE_URL`.

## 🔒 Security Best Practices

### Production Setup
- Use environment variables, never hardcode secrets
- Ensure `EMAIL_TO` is set to your real email address
- Use a secure database password
- Never share your `.env` file

### Development Overrides
For development only, you can bypass isolation with:
```bash
NODE_ENV=development
OVERRIDE_ALLOW_SHARED_DB=true
CONFIRM_SHARED_DB_RISK=I_UNDERSTAND_DATA_ISOLATION_RISK
```

**⚠️ WARNING:** Never use these in production!

## 📊 Database Management

### Schema Updates
The application automatically creates and updates database tables. You don't need to run migrations manually.

### Database Backup
Always backup your database regularly:
- Neon: Use their backup features
- Local: `pg_dump my_fork_db > backup.sql`

## 📧 Email Configuration

### Gmail Setup (Optional)
If you want to send welcome emails via Gmail:
```bash
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

### SendGrid Setup (Optional)
If you want to use SendGrid for emails:
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## 🆘 Getting Help

If you encounter issues:

1. **Check the startup logs**: The validation system provides clear error messages
2. **Verify your `.env` file**: Ensure all required variables are set
3. **Test your database connection**: Make sure your `DATABASE_URL` is accessible
4. **Check email format**: Ensure `EMAIL_TO` is a valid email address

## 🎯 Next Steps

After successful setup:

1. **Customize your configuration**: Use the configuration form at `/configuration`
2. **Test lead submission**: Try the lead form at `/submission-form`
3. **Check your dashboard**: View leads at the main page `/`
4. **Configure agents**: Add your real estate agents in the configuration

## 📁 File Structure

```
├── .env.example          # Environment variable template
├── .env                  # Your private configuration (create this)
├── FORK_SETUP_GUIDE.md   # This guide
├── shared/schema.ts      # Database schema
├── server/               # Backend code
└── client/              # Frontend code
```

---

**Remember**: Each fork is completely independent. Your leads, configuration, and data are private to your fork when properly configured!