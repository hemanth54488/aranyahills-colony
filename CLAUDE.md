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

**React 19 SPA** with Vite 8, deployed to Vercel. Backend is Supabase (Postgres + Auth + Storage).

### Auth & Routing

`src/main.jsx` wraps everything in `BrowserRouter > AuthProvider > Toaster`. The `AuthContext` (`src/context/AuthContext.jsx`) holds the session, profile, and computed flags (`isAdmin`, `isApproved`, `isCommittee`).

`src/App.jsx` defines all routes with two guards:
- `ProtectedRoute` — checks approval status; `adminOnly` prop restricts to admin role
- `SecurityRoute` — allows only `security` or `admin` roles

**Route categories:**
- **Public**: `/`, `/login`, `/register`, `/committee`, `/notices`, `/events`
- **Approved residents**: `/plots`, `/plots/:id`, `/colony-info`, `/services`, `/profile`, `/profile/id-card`, `/maintenance`, `/complaints`, `/complaints/:id`, `/facilities`, `/visitors`, `/polls`, `/classifieds`, `/documents`
- **Security role**: `/security`
- **Admin only**: `/admin`, `/admin/committee`, `/admin/registrations`, `/admin/plots`, `/admin/notices`, `/admin/maintenance`, `/admin/complaints`, `/admin/facilities`, `/admin/events`, `/admin/polls`, `/admin/documents`, `/admin/audit-logs`

### Data Fetching

Pages use direct Supabase JS calls with `useState` + `useEffect`. Pattern:
```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
useEffect(() => {
  supabase.from('table').select('*, related(*)').then(({ data }) => setData(data))
}, [])
```
Supabase client is a singleton in `src/lib/supabase.js`.

### File Upload (Supabase Storage)

Use `src/lib/upload.js` for all file uploads — never call the storage API directly:
```javascript
import { uploadPhoto, uploadDocument, deleteFile } from '../lib/upload'

const { publicUrl } = await uploadPhoto(file, progressCallback)   // images
const { publicUrl } = await uploadDocument(file, progressCallback) // PDF/Word/images
```
The `PhotoUpload` component (`src/components/PhotoUpload.jsx`) is a drop-in widget with progress indicator and preview — use it anywhere a photo needs to be uploaded.

Bucket name: `colony-files` (public). Setup SQL: `supabase/setup_storage.sql`.

### Database

**20 total tables** across two schema files:
- `supabase/schema.sql` — original 8 tables (profiles, plots, committee_members, family_members, notices, documents, service_providers, colony_info)
- `supabase/schema_v2.sql` — 12 new tables: `vehicles`, `maintenance_invoices`, `maintenance_payments`, `complaints`, `complaint_updates`, `facility_bookings`, `visitors`, `events`, `polls`, `poll_votes`, `classifieds`, `audit_logs`

All tables have RLS enabled. SQL helper functions `is_admin()` and `is_approved_user()` are used in all policies.

### Design System

Tailwind CSS v4 with custom tokens in `src/index.css`:
- **Forest** (green scale) — primary brand `#15803d`
- **Earth / Gold** — accent colors
- **Fonts**: `font-display` (Playfair Display) for headings, Inter for body
- Utility classes: `.glass`, `.glass-dark`, `.text-gradient-gold`, `.text-gradient-green`, `.card-hover`, `.btn-primary`, `.btn-glass`, `.bg-hero`, `.bg-mesh`
- Animation classes: `.animate-fade-up`, `.animate-scale-in`, `.animate-card-up`, `.animate-photo-pop`, `.animate-badge-pop`, `.animate-leaf-spin`, `.animate-logout-slide`, `.animate-overlay-in`
- Delay helpers: `.delay-100` through `.delay-700`

### Logo

`src/components/ColonyLogo.jsx` — custom SVG logo (hills + house + sun, matches board image). Accepts `size` prop. Used in Navbar (58px), Footer (56px), Login overlay (96px), Home watermark (320px).

### i18n

Three locales in `src/i18n/locales/`: `en.json`, `te.json`, `hi.json`. Language is auto-detected from localStorage then `navigator`. Switch with `i18n.changeLanguage('te')`.

**Always add new user-facing strings to all three locale files.** Committee role keys exist in both camelCase (`vicePresident`) and snake_case (`vice_president`) — always keep both in sync.

### Notifications

Use the factory in `src/lib/notify.jsx`:
```javascript
import notify from '../lib/notify'
notify.success('Saved')
notify.error('Something went wrong')
notify.warning('Check input')
notify.info('FYI')
```

### Validation Pattern

All forms follow the pattern from `ManageCommittee.jsx`:
```javascript
const RULES = { field: v => { if (!v) return 'Required'; return '' } }
function inputClass(touched, error) { /* returns border-red or border-forest */ }
function FieldMsg({ touched, error }) { /* shows AlertCircle + message */ }
```
Always validate at field blur (`onBlur`) and on submit (`touchAll()`).

### Admin Pages

All under `src/pages/admin/`. The Dashboard (`/admin`) shows live stats and links to:

| Page | Route | Purpose |
|---|---|---|
| ManageCommittee | `/admin/committee` | Add/archive/delete members + photo upload |
| ManagePlots | `/admin/plots` | Edit plot details + GPS |
| PendingRegistrations | `/admin/registrations` | Approve/reject residents |
| ManageNotices | `/admin/notices` | Create/edit/pin/delete notices (EN/TE/HI) |
| ManageMaintenance | `/admin/maintenance` | Create invoices, verify payments |
| ManageComplaints | `/admin/complaints` | Assign, update status, resolve |
| ManageFacilities | `/admin/facilities` | Approve/reject bookings |
| ManageEvents | `/admin/events` | Create/edit colony events |
| ManagePolls | `/admin/polls` | Create polls, view results |
| ManageDocuments | `/admin/documents` | Upload/manage colony documents |
| AuditLogs | `/admin/audit-logs` | Searchable admin action log |

## Deployment

Auto-deploys to Vercel on push to `main`. `vercel.json` rewrites all paths to `index.html` for SPA routing. Production: `aranyahillscolony.in`. Staging: `aranyahills-colony.vercel.app`.

## Supabase SQL Files

| File | Purpose | Run when |
|---|---|---|
| `supabase/schema.sql` | Original 8 tables + seed | Fresh project setup |
| `supabase/schema_v2.sql` | 12 new feature tables | After schema.sql |
| `supabase/setup_storage.sql` | `colony-files` storage bucket + policies | Once, for file upload |
| `supabase/seed_committee.sql` | 2026 committee members + letterhead doc | After schema_v2.sql |
