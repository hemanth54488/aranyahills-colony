# Aranya Hills Colony Website — Setup Guide

## Quick Start

### Step 1: Create Supabase Project
1. Go to https://supabase.com and create a free account
2. Click "New Project" → Name it "aranyahills-colony"
3. Choose a strong database password (save it!)
4. Select region: **Asia Pacific (Singapore)** (closest to Hyderabad)
5. Wait for project to be ready (~2 minutes)

### Step 2: Set Up Database
1. In Supabase dashboard → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase/schema.sql` from this project
4. Copy ALL the SQL and paste it into the editor
5. Click **Run** — this creates all tables, security rules, and seeds 26 plots

### Step 3: Create Your Admin Account
1. In Supabase → **Authentication** → **Users** → Click "Invite User"
2. Enter your email → Send invite
3. Check email, set password, then log in to the website
4. Back in Supabase → **Table Editor** → `profiles` table
5. Find your user row → Change `role` to `admin` and `status` to `approved`

### Step 4: Get Your API Keys
1. In Supabase → **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** (looks like: https://xxxx.supabase.co)
   - **anon public key** (long string starting with "eyJ...")

### Step 5: Configure Environment Variables
1. In this project folder, create a file named `.env`
2. Add these lines (replace with your actual values):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Step 6: Get Google Maps API Key (Free)
1. Go to https://console.cloud.google.com
2. Create a new project → Enable **Maps JavaScript API**
3. Go to Credentials → Create API Key
4. Restrict the key to your domain for security
5. Add it to `.env` as `VITE_GOOGLE_MAPS_API_KEY`

### Step 7: Run the Website Locally
```bash
npm install
npm run dev
```
Open http://localhost:5173 in your browser

---

## Deploying to Vercel (Free Hosting)

1. Create free account at https://vercel.com
2. Click "Add New Project" → Import from GitHub
3. Push this code to GitHub first:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Aranya Hills Colony Website"
   git remote add origin https://github.com/YOUR_USERNAME/aranyahills-colony.git
   git push -u origin main
   ```
4. In Vercel → Import your GitHub repo
5. Add Environment Variables (same as your .env file)
6. Click Deploy!
7. Your site will be live at: yourproject.vercel.app

### Connect Your Domain (aranyahillscolony.in)
1. After deploying on Vercel → Project Settings → Domains
2. Add `aranyahillscolony.in`
3. In your domain registrar (GoDaddy/BigRock) → DNS settings
4. Add a CNAME record pointing to your Vercel URL
5. Within 24 hours, https://aranyahillscolony.in will be live!

---

## Setting Up Cloudinary for Photos (Free)

1. Go to https://cloudinary.com → Create free account
2. In the dashboard, note your **Cloud Name**
3. Photos uploaded via Cloudinary give you a URL like:
   `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/...`
4. Use these URLs when adding house photos, committee member photos etc.

---

## Admin Tasks (For Secretary)

### Add a Committee Member
1. Log in → Click your name → Admin Panel
2. Click "Manage Committee" → "Add Member"
3. Fill in name, role, year, phone, email
4. Optionally add a Cloudinary photo URL

### Approve a New Registration
1. Log in → Admin Panel
2. You'll see a banner if registrations are pending
3. Click "Pending Registrations" → Approve or Reject

### Update Plot Information
1. Admin Panel → "Manage Plots"
2. Click "Edit" next to any plot
3. Update status, area, address, Google Maps coordinates
4. To get coordinates: Open Google Maps → Right-click on location → Copy coordinates

### Post a Notice
Coming in Phase 2 — Admin panel will include a "Post Notice" button

---

## Languages
The website supports 3 languages — toggle in top-right corner:
- **EN** — English
- **TE** — Telugu (తెలుగు)
- **HI** — Hindi (हिंदी)

---

## Need Help?
Contact the developer or refer to:
- Supabase docs: https://supabase.com/docs
- Vercel docs: https://vercel.com/docs
