# System Architecture

## Overview

Aranya Hills Colony website is a Single Page Application (SPA) built with React, backed by Supabase (PostgreSQL) as the database and authentication provider, hosted on Vercel.

```
+---------------------------+
|        BROWSER            |
|   React SPA (Vite)        |
|   - React Router          |
|   - React Context API     |
|   - Tailwind CSS v4       |
|   - i18next (EN/TE/HI)    |
+----------+----------------+
           |  HTTPS
           |  REST API / Realtime
+----------v----------------+
|        SUPABASE           |
|   +-------------------+   |
|   | PostgreSQL DB     |   |
|   | 8 Tables          |   |
|   | RLS Policies      |   |
|   +-------------------+   |
|   +-------------------+   |
|   | Auth (JWT)        |   |
|   | Email OTP         |   |
|   +-------------------+   |
|   +-------------------+   |
|   | Storage           |   |
|   | (future photos)   |   |
|   +-------------------+   |
+---------------------------+
           |
+----------v----------------+
|   EXTERNAL SERVICES       |
|   - Cloudinary (photos)   |
|   - Unsplash (bg images)  |
|   - Google Maps (future)  |
|   - Resend (email)        |
+---------------------------+

HOSTING
+---------------------------+
|   Vercel (Frontend)       |
|   - CDN Edge Network      |
|   - Auto SSL (HTTPS)      |
|   - CI/CD from GitHub     |
|   aranyahillscolony.in    |
+---------------------------+
```

## Frontend Architecture

### Component Tree
```
App.jsx (Router + Route Guards)
+-- Navbar.jsx
+-- Pages/
|   +-- Home.jsx
|   |   +-- StatCard (animated counter)
|   |   +-- CommitteeMiniCard
|   +-- Login.jsx (split-screen layout)
|   +-- Register.jsx (multi-field validation)
|   +-- Committee.jsx
|   |   +-- MemberCard
|   +-- Plots.jsx
|   |   +-- PlotCard (grid)
|   +-- PlotDetail.jsx
|   +-- ColonyInfo.jsx
|   +-- Notices.jsx
|   +-- Services.jsx
|   |   +-- AddProviderModal
|   +-- admin/
|       +-- Dashboard.jsx
|       +-- ManageCommittee.jsx
|       |   +-- AddMemberModal (validated)
|       |   +-- ConfirmDialog
|       +-- ManagePlots.jsx (inline edit)
|       +-- PendingRegistrations.jsx
+-- Footer.jsx
```

### State Management
- Global auth state: React Context API (AuthContext)
- Local UI state: useState hooks
- No Redux or Zustand needed (small app)
- Data fetching: direct Supabase JS client calls

### Routing
```
PUBLIC ROUTES (no login needed)
/                    Home page
/login               Login
/register            Register
/committee           Committee members
/notices             Notice board

PROTECTED ROUTES (login + approved)
/plots               Plot directory
/plots/:id           Plot detail
/colony-info         Bank details, bylaws
/services            Service providers

ADMIN ROUTES (admin role only)
/admin               Dashboard
/admin/committee     Manage committee
/admin/plots         Manage plots
/admin/registrations Pending approvals
```

### Authentication Flow
```
User visits site
    |
    v
Supabase session check (localStorage)
    |
    +-- Session exists --> load profile --> check status
    |       |
    |       +-- pending  --> show "Account Pending" page
    |       +-- approved --> allow access to protected routes
    |       +-- admin    --> allow access to admin routes
    |
    +-- No session --> public routes only
```

### Internationalization (i18n)
```
src/i18n/
+-- index.js              i18next configuration
+-- locales/
    +-- en.json           English translations
    +-- te.json           Telugu translations
    +-- hi.json           Hindi translations

Language selection:
- Stored in user profile (preferred_language column)
- Also saved in localStorage via i18next-browser-languagedetector
- Language switcher in Navbar top-right
```

## Data Flow

### Registration Flow
```
User fills Register form
    |
    v
Client validation (inline, real-time)
    |
    v
supabase.auth.signUp() called
    |
    v
Supabase creates auth.users row
    |
    v
handle_new_user() trigger fires
    |
    v
profiles row created (status=pending)
    |
    v
Admin gets notified
    |
    v
Admin approves in /admin/registrations
    |
    v
profiles.status = 'approved'
    |
    v
User can now access protected routes
```

### Admin Operations Flow
```
Admin logs in (role=admin, status=approved)
    |
    v
Admin Dashboard (/admin)
    |
    +-- Manage Committee --> Add/Archive/Delete members
    +-- Manage Plots     --> Edit plot details + coordinates
    +-- Pending Registrations --> Approve/Reject residents
```

## Security Architecture

### Authentication
- JWT tokens issued by Supabase Auth
- Tokens stored in localStorage (managed by Supabase JS client)
- Tokens expire after 1 hour, auto-refreshed
- No passwords stored in our database

### Authorization (Row Level Security)
- Every table has RLS enabled
- SELECT policies control read access
- INSERT, UPDATE, DELETE policies control write access
- is_admin() and is_approved_user() helper functions used in policies

### API Security
- Supabase anon key is safe to expose (it is limited by RLS)
- service_role key NEVER used in frontend
- All sensitive data (bank details) only accessible to approved users

## Deployment Architecture

```
Developer pushes code to GitHub (main branch)
    |
    v
Vercel detects push via webhook
    |
    v
Vercel runs: npm install && npm run build
    |
    v
Build output (dist/) deployed to Vercel CDN
    |
    v
Available at:
- aranyahills-colony.vercel.app (instant)
- aranyahillscolony.in (via GoDaddy DNS --> Vercel)
```

### DNS Configuration
```
GoDaddy DNS for aranyahillscolony.in
+------------------+-------+---------------------+
| Type             | Name  | Value               |
+------------------+-------+---------------------+
| A                | @     | 76.76.21.21         |
| CNAME            | www   | cname.vercel-dns.com|
+------------------+-------+---------------------+

Vercel handles:
- SSL/TLS certificate (auto-renewed)
- HTTP -> HTTPS redirect
- www -> non-www redirect (308)
- Global CDN edge caching
```
