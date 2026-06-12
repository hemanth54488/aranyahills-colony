# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build (outputs to dist/)
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=   # optional
```

## Architecture

**React 19 SPA** with Vite, deployed to Vercel. Backend is Supabase (Postgres + Auth).

### Auth & Routing

`src/main.jsx` wraps everything in `BrowserRouter > AuthProvider > Toaster`. The `AuthContext` (`src/context/AuthContext.jsx`) holds the session, profile, and computed flags (`isAdmin`, `isApproved`, `isCommittee`).

`src/App.jsx` defines all routes and a `ProtectedRoute` wrapper that checks approval status and role. Route categories:
- **Public**: `/`, `/login`, `/register`, `/committee`, `/notices`
- **Approved users**: `/plots`, `/plots/:id`, `/colony-info`, `/services`
- **Admin only**: `/admin/*`

### Data Fetching

Pages use direct Supabase JS calls with `useState` + `useEffect` — React Query is installed but not yet used. Pattern:
```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
useEffect(() => {
  supabase.from('table').select('*, related(*)').then(({ data }) => setData(data))
}, [])
```

Supabase client is a singleton in `src/lib/supabase.js`.

### Database

8 tables in `supabase/schema.sql`. Key ones:
- **profiles** — extends `auth.users`; has `status` (`pending`/`approved`) and `role` (`resident`/`admin`)
- **plots** — 26 plots with status, area, GPS coords
- **committee_members**, **family_members**, **notices**, **service_providers**, **documents**, **colony_info**

All tables have RLS enabled. SQL helper functions `is_admin()` and `is_approved_user()` are used in policies. New registrations trigger `handle_new_user()` which creates a profile with `status='pending'` — an admin must approve via `/admin/registrations`.

### Design System

Tailwind CSS v4 with custom tokens defined in `src/index.css`:
- **Forest** (green scale) — primary brand color `#15803d`
- **Earth** (gold/amber scale) — accent color
- **Fonts**: `font-display` (Playfair Display) for headings, Inter for body
- Utility classes: `.glass`, `.glass-dark` (backdrop blur), `.text-gradient-gold`, `.text-gradient-green`

### i18n

Three locales in `src/i18n/locales/`: `en.json`, `te.json`, `hi.json`. Language is auto-detected from localStorage then `navigator`. Switch with `i18n.changeLanguage('te')`. Always add new user-facing strings to all three locale files.

### Notifications

Use the factory in `src/lib/notify.jsx` instead of `toast` directly:
```javascript
import notify from '../lib/notify'
notify.success('Saved')
notify.error('Something went wrong')
notify.warning('Check input')
notify.info('FYI')
```

### Admin Pages

All under `src/pages/admin/`. Dashboard shows colony stats; ManageCommittee and ManagePlots handle CRUD with inline modals; PendingRegistrations handles the approval workflow.

## Deployment

Auto-deploys to Vercel on push to `main`. `vercel.json` rewrites all paths to `index.html` for SPA routing. Production domain: `aranyahillscolony.in`.
