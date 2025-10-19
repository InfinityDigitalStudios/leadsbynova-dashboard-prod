# Deployment Instructions for Real Estate Apps

You now have 4 completely independent applications ready for deployment as separate Replit projects:

## 📁 Apps Available:

1. **`submission-form/`** - Lead capture form
2. **`buyer-chat/`** - Buyer-focused chat application  
3. **`seller-chat/`** - Seller-focused chat application
4. **`dashboard/`** - Management dashboard

## 🚀 How to Deploy Each App:

### Step 1: Create New Replit Projects
1. Go to your Replit dashboard
2. Click **"Create App"** (do this 4 times for each app)
3. Choose **"Blank"** template
4. Name each project:
   - `real-estate-submission-form`
   - `real-estate-buyer-chat`
   - `real-estate-seller-chat`
   - `real-estate-dashboard`

### Step 2: Copy App Files
For each app:
1. **Copy all files** from the corresponding `standalone-apps/[app-name]/` folder
2. **Paste them** into the root of your new Replit project
3. Make sure to copy:
   - All client/ files
   - All server/ files
   - package.json
   - shared/ folder
   - Configuration files (drizzle.config.ts, tailwind.config.ts, etc.)

### Step 3: Set Up Each Project
In each new Replit project:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database** (if using PostgreSQL):
   - Go to Database tab in Replit
   - Create a new PostgreSQL database
   - Push schema: `npm run db:push` (you may need to add this script)

3. **Run the app:**
   ```bash
   npm run dev
   ```

## 🔧 Required Environment Variables:

### For Submission Form:
- `DATABASE_URL` (automatically set by Replit database)
- `SENDGRID_API_KEY` (optional, for email sending)
- `FROM_EMAIL` (optional, for email sending)

### For Chat Apps:
- `DATABASE_URL` (automatically set by Replit database)

### For Dashboard:
- `DATABASE_URL` (automatically set by Replit database)

## ✅ Verification:

Each app should run independently on:
- **Submission Form**: Port 5000
- **Buyer Chat**: Port 5000  
- **Seller Chat**: Port 5000
- **Dashboard**: Port 5000

## 🔗 Publishing:

Once each app is working:
1. Click **"Deploy"** in each Replit project
2. Your apps will be available at separate URLs
3. Users can fork any individual app they want

## 🎯 End Result:

You'll have 4 separate, forkable Replit projects:
- `https://your-username.replit.app/submission-form`
- `https://your-username.replit.app/buyer-chat`  
- `https://your-username.replit.app/seller-chat`
- `https://your-username.replit.app/` (dashboard)

Each can be forked independently by other users!