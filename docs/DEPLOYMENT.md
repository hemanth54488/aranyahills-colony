# Deployment Guide

## Overview

The website is deployed on Vercel (free hosting) with automatic deployments from GitHub. The custom domain aranyahillscolony.in is managed through GoDaddy.

## Architecture
```
GitHub (code) --> Vercel (build + host) --> aranyahillscolony.in (GoDaddy DNS)
```

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- GitHub account
- Vercel account (free)
- Supabase account (free)
- GoDaddy domain

## Step 1: Database Setup (Supabase)

1. Create account at https://supabase.com
2. Create new project: "aranyahills-colony"
3. Region: Asia Pacific (Singapore)
4. Save your database password

### Run the schema
1. Supabase Dashboard > SQL Editor > New Query
2. Copy contents of supabase/schema.sql
3. Paste and click Run
4. Verify 8 tables created in Table Editor

### Get API credentials
1. Supabase > Settings > API
2. Copy:
   - Project URL: https://xxxx.supabase.co
   - anon public key: eyJ...

## Step 2: GitHub Setup

```
git clone https://github.com/hemanth54488/aranyahills-colony.git
cd aranyahills-colony
npm install
```

Create .env file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
```

## Step 3: Vercel Deployment

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import hemanth54488/aranyahills-colony
5. Framework: Vite (auto-detected)
6. Add Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_GOOGLE_MAPS_API_KEY
7. Click Deploy

Site live at: https://aranyahills-colony.vercel.app

## Step 4: Custom Domain (GoDaddy)

### On Vercel
1. Project > Settings > Domains
2. Add: aranyahillscolony.in
3. Add: www.aranyahillscolony.in

### On GoDaddy
DNS Records to add:
```
Type   Name   Value                 TTL
A      @      76.76.21.21           600
CNAME  www    cname.vercel-dns.com  600
```

Wait 15-60 minutes for DNS propagation.

## Step 5: Admin Account Setup

1. Go to /register on your site
2. Register with your email
3. In Supabase > Table Editor > profiles
4. Find your row
5. Set role = 'admin'
6. Set status = 'approved'
7. Save

## Continuous Deployment

Every git push to main branch automatically deploys to Vercel:

```
git add .
git commit -m "Your changes"
git push origin main
```

Vercel detects the push and rebuilds within 2-3 minutes.

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| VITE_SUPABASE_URL | YES | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | YES | Supabase anonymous key |
| VITE_GOOGLE_MAPS_API_KEY | NO | Google Maps API key |

## Build Commands

```
npm run dev      # Start development server (localhost:5173)
npm run build    # Build for production (output: dist/)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint checks
```

## Rollback

If a deployment breaks the site:
1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click the 3 dots > "Promote to Production"

## Troubleshooting

### Build fails on Vercel
- Check all npm packages are in package.json (not just installed locally)
- Check environment variables are set in Vercel dashboard
- Check build logs for specific error

### Database connection fails
- Verify VITE_SUPABASE_URL is correct (no trailing slash)
- Verify VITE_SUPABASE_ANON_KEY is the anon key (not service_role)
- Check Supabase project is not paused (free tier pauses after inactivity)

### Domain not working
- DNS propagation can take up to 24 hours
- Verify A record points to 76.76.21.21
- Verify CNAME for www points to cname.vercel-dns.com
- Check Vercel shows "Valid Configuration" (not "DNS Change Recommended")
