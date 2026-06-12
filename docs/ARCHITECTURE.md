# System Architecture

## Overview

Aranya Hills Colony website is a Single Page Application (SPA) built with React 19, backed by Supabase (PostgreSQL + Auth + Storage), hosted on Vercel.

```
+---------------------------+
|        BROWSER            |
|   React 19 SPA (Vite 8)   |
|   - React Router 7        |
|   - React Context API     |
|   - Tailwind CSS v4       |
|   - i18next (EN/TE/HI)    |
+----------+----------------+
           |  HTTPS
           |  REST API / Realtime / Storage
+----------v----------------+
|        SUPABASE           |
|   +-------------------+   |
|   | PostgreSQL DB     |   |
|   | 20 Tables         |   |
|   | RLS Policies      |   |
|   +-------------------+   |
|   +-------------------+   |
|   | Auth (JWT)        |   |
|   | Email OTP         |   |
|   +-------------------+   |
|   +-------------------+   |
|   | Storage           |   |
|   | colony-files      |   |
|   | (photos, docs)    |   |
|   +-------------------+   |
+---------------------------+
           |
+----------v----------------+
|   EXTERNAL SERVICES       |
|   - ui-avatars.com (avatar fallback) |
|   - Unsplash CDN (bg images)         |
|   - Google Maps (plot GPS)           |
|   - Resend.com (email)               |
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

---

## Frontend Architecture

### Component Tree

```
main.jsx
  BrowserRouter
    AuthProvider (src/context/AuthContext.jsx)
      Toaster (react-hot-toast)
        App.jsx (route definitions + guards)
          Navbar.jsx
            ColonyLogo.jsx (SVG, size prop)
            NavDropdown (My Colony, Community dropdowns)
          <Routes>
            -- PUBLIC --
            Home.jsx → StatCard, CommitteeMiniCard
            Login.jsx (welcome overlay animation)
            Register.jsx (multi-field, password strength)
            Committee.jsx → MemberCard (circular photo + animations)
            Notices.jsx
            Events.jsx
            -- PROTECTED (approved residents) --
            Profile.jsx → PhotoUpload.jsx (Supabase Storage)
            IdCard.jsx (printable, role-coloured)
            Plots.jsx / PlotDetail.jsx
            Maintenance.jsx (dues + payment modal)
            Complaints.jsx / ComplaintDetail.jsx (stepper + rating)
            Facilities.jsx (booking + upcoming widget)
            Visitors.jsx (gate pass codes)
            Polls.jsx (vote + live results)
            Classifieds.jsx (grid cards)
            Documents.jsx (smart download)
            ColonyInfo.jsx / Services.jsx
            -- SECURITY ROLE --
            Security.jsx (gate pass verify + entry/exit log)
            -- ADMIN --
            admin/Dashboard.jsx (live stats + section links)
            admin/ManageCommittee.jsx + EditPhotoModal
            admin/ManagePlots.jsx
            admin/PendingRegistrations.jsx
            admin/ManageNotices.jsx (trilingual editor)
            admin/ManageMaintenance.jsx (bulk invoice + verify)
            admin/ManageComplaints.jsx (assign + status update)
            admin/ManageFacilities.jsx (approve/reject)
            admin/ManageEvents.jsx
            admin/ManagePolls.jsx (bar chart results)
            admin/ManageDocuments.jsx (file upload + URL)
            admin/AuditLogs.jsx (searchable table)
          Footer.jsx
```

### State Management

- **Global auth state:** React Context API (`AuthContext`) — user, profile, isAdmin, isApproved, isCommittee
- **Local UI state:** `useState` hooks per component
- **Data fetching:** Direct Supabase JS client calls with `useState + useEffect`
- React Query is installed but not yet used

### Shared Utilities

| File | Purpose |
|---|---|
| `src/lib/supabase.js` | Supabase client singleton |
| `src/lib/notify.jsx` | Toast notification factory (success/error/warning/info) |
| `src/lib/upload.js` | Supabase Storage upload helpers (`uploadPhoto`, `uploadDocument`, `deleteFile`) |
| `src/components/ColonyLogo.jsx` | SVG logo component (scalable, size prop) |
| `src/components/PhotoUpload.jsx` | Reusable photo upload widget with progress |

---

## Routing

```
PUBLIC (no login required)
/                    Home — hero, stats, committee preview, notices
/login               Login with welcome animation
/register            Registration with approval pending
/committee           Committee page with animated member cards
/notices             Notice board
/events              Events calendar

PROTECTED (login + approved status required)
/profile             Edit info, family, vehicles, upload avatar
/profile/id-card     Digital ID card (printable)
/plots               26-plot directory
/plots/:id           Plot detail
/maintenance         Maintenance dues and payment history
/complaints          List and raise complaints
/complaints/:id      Complaint detail with status timeline
/facilities          Facility booking
/visitors            Visitor pre-approval and gate passes
/polls               Community polls and voting
/classifieds         Buy/sell/rent listings
/documents           Colony document downloads
/colony-info         Bank details, bylaws
/services            Service provider directory

SECURITY ROLE (/security or /admin)
/security            Gate pass verification and entry/exit logging

ADMIN ONLY (/admin)
/admin               Dashboard with live stats
/admin/registrations Approve/reject pending residents
/admin/committee     Add/archive/delete members + photo upload
/admin/plots         Edit plot details + GPS coordinates
/admin/notices       Create/edit/pin/delete notices (trilingual)
/admin/maintenance   Create invoices, verify payments
/admin/complaints    Assign, update status, resolve complaints
/admin/facilities    Approve/reject facility bookings
/admin/events        Create/edit colony events
/admin/polls         Create polls, view results
/admin/documents     Upload/manage colony documents
/admin/audit-logs    Searchable admin action log
```

### Route Guards

```jsx
// Checks login + approved status; adminOnly prop restricts to role='admin'
<ProtectedRoute adminOnly={false}>...</ProtectedRoute>

// Only allows role='security' or role='admin'
<SecurityRoute>...</SecurityRoute>
```

---

## Authentication Flow

```
User visits site
    |
    v
Supabase session check (localStorage JWT)
    |
    +-- Session exists --> fetchProfile() --> check status
    |       |
    |       +-- pending  --> show "Account Pending" message
    |       +-- approved --> full access to protected routes
    |       +-- admin    --> access to all routes + admin panel
    |
    +-- No session --> public routes only
                        Login shows welcome overlay on success
                        Logout shows goodbye overlay
```

---

## File Upload Flow

```
User clicks PhotoUpload / ManageDocuments upload button
    |
    v
src/lib/upload.js validates file (type + size ≤ 5MB)
    |
    v
supabase.storage.from('colony-files').upload(path, file)
    |
    v
Progress callback updates UI (0% → 10% → 90% → 100%)
    |
    v
getPublicUrl() returns permanent CDN URL
    |
    v
URL saved to database (photo_url, file_url, avatar_url)
```

---

## Internationalization

```
src/i18n/
+-- index.js              i18next config (languagedetector + localStorage cache)
+-- locales/
    +-- en.json           English (primary)
    +-- te.json           Telugu
    +-- hi.json           Hindi

Sections: app, nav, home, committee, plots, colonyInfo, services,
          auth, admin, notices, profile, idcard, maintenance,
          complaints, facilities, visitors, security, events,
          polls, classifieds, documents, footer, common

Note: committee role keys exist in BOTH camelCase (vicePresident)
and snake_case (vice_president) — DB stores snake_case.
```

---

## Animation System

All animations defined in `src/index.css` as keyframe + utility class pairs.

| Class | Effect | Used in |
|---|---|---|
| `animate-fade-up` | Fade up from 48px | Hero text, stat cards |
| `animate-scale-in` | Scale from 0.85 | Confirm dialogs |
| `animate-card-up` | Slide up from 40px | Committee cards, header |
| `animate-photo-pop` | Bouncy scale with rotation | Committee photo circles |
| `animate-badge-pop` | Spring from top | Committee role badges |
| `animate-overlay-in/out` | Full-screen scale fade | Login/logout overlays |
| `animate-leaf-spin` | 360° rotation | Login overlay logo |
| `animate-logout-slide` | Slide in + hold + slide out | Logout overlay |
| `animate-pulse-ring` | Gold glow ring pulse | Logo, hover effects |
| `animate-float/float2/float3` | Floating decoration | Background leaves |
| `delay-100` … `delay-700` | Animation delay helpers | Staggered sequences |

---

## Security Architecture

### Authentication
- JWT tokens issued by Supabase Auth, stored in localStorage
- Tokens auto-refresh (1 hour expiry)
- No passwords stored in our database

### Authorization (Row Level Security)
- All 20 tables have RLS enabled
- `is_admin()` and `is_approved_user()` helper functions used in policies
- Supabase anon key is safe to expose — RLS enforces all permissions
- `service_role` key never used in frontend

### Sensitive Data
- Bank account details (`colony_info`) — approved users only
- Audit logs — admin only
- Maintenance payment details — own plot + admin only

---

## Deployment

```
Developer pushes code to GitHub (main branch)
    |
    v
Vercel detects push via webhook
    |
    v
Vercel runs: npm install && npm run build (Vite)
    |
    v
Build output (dist/) deployed to Vercel CDN globally
    |
    v
Available at:
- aranyahills-colony.vercel.app (instant)
- aranyahillscolony.in (via GoDaddy DNS → Vercel)
```

### DNS Configuration

```
GoDaddy DNS for aranyahillscolony.in
A record:     @     → 76.76.21.21
CNAME record: www   → cname.vercel-dns.com

Vercel handles: SSL, HTTP→HTTPS, www→non-www redirect, CDN caching
```
