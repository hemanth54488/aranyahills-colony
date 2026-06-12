# Feature Plan — Aranya Hills Colony Website

## Phase 1 — Complete ✅

| Feature | Status |
|---|---|
| Resident registration & login (email/password) | ✅ |
| Pending approval workflow | ✅ |
| 26-plot directory with search & filter | ✅ |
| Plot detail with family members & GPS | ✅ |
| Committee members (current + archived) | ✅ |
| Notices board (priority, pinned, multilingual) | ✅ |
| Service providers directory | ✅ |
| Colony info page (bylaws, bank details) | ✅ |
| Admin: manage plots, committee, registrations | ✅ |
| Multi-language EN / TE / HI | ✅ |
| Role-based access (admin, committee, resident, security) | ✅ |
| Emergency contacts on home page | ✅ |

---

## Phase 2 — Complete ✅

### 2.1 Resident Self-Service
- Profile page (`/profile`) — edit name, phone, language, upload photo
- Family members tab — add/remove household members
- Vehicles tab — add/remove registered vehicles
- Digital ID card (`/profile/id-card`) — printable, role-coloured, with QR placeholder

### 2.2 Maintenance Fee Management
- Resident view (`/maintenance`) — outstanding dues, payment history, mark as paid
- Admin view (`/admin/maintenance`) — bulk invoice creation, payment verification
- Tables: `maintenance_invoices`, `maintenance_payments`

### 2.3 Complaints & Service Requests
- Resident view (`/complaints`) — raise complaint, filter by status
- Detail page (`/complaints/:id`) — 5-step stepper timeline, 5-star rating after resolve
- Admin view (`/admin/complaints`) — assign to committee, update status, resolve
- Tables: `complaints`, `complaint_updates`

### 2.4 Facility Booking
- Resident view (`/facilities`) — book hall/clubhouse/sports court/guest house/terrace
- Upcoming approved bookings widget
- Admin view (`/admin/facilities`) — approve/reject with reason
- DB-level constraint prevents double-booking
- Table: `facility_bookings`

### 2.5 Visitor & Security Management
- Resident view (`/visitors`) — pre-approve visitors, get 8-char gate pass code
- Security dashboard (`/security`) — verify pass code, log entry/exit
- Table: `visitors`

### 2.6 Admin Notice Posting UI
- Full create/edit/delete/pin UI at `/admin/notices`
- Trilingual content (EN/TE/HI), priority levels, expiry date
- Previously the notices table existed but had no admin UI

---

## Phase 3 — Complete ✅

### 3.1 Events Calendar
- Public page `/events` — upcoming and past events with date badges
- Admin CRUD at `/admin/events`
- Table: `events`

### 3.2 Polls & Surveys
- Resident page `/polls` — vote, see results (configurable show timing)
- Admin page `/admin/polls` — create polls with multiple options, close, view bar chart results
- Tables: `polls`, `poll_votes` (UNIQUE constraint prevents double voting)

### 3.3 Classifieds (Buy / Sell / Rent within Colony)
- Resident page `/classifieds` — browse by type, post ad, mark as done
- Types: sell, buy, rent, service, lost_found
- Table: `classifieds`

### 3.4 Documents
- Resident page `/documents` — browse by category, download
- Admin page `/admin/documents` — upload via Supabase Storage or paste URL, toggle public/private
- Smart download: Supabase Storage files use SDK download; Google Drive links auto-convert
- Table: `documents` (pre-existing, now with upload UI)

### 3.5 Audit Logs
- Admin page `/admin/audit-logs` — searchable log of all admin actions
- Table: `audit_logs`

---

## UI & Brand Improvements (Done)

| Improvement | Description |
|---|---|
| Custom SVG logo | Hills + house + sun design matching the colony board image |
| Registration number | REG.NO: 469 OF 2026 in navbar, home hero, footer |
| Motto | "Unity • Development • Harmony" in hero and footer |
| Login animation | Full-screen welcome overlay with spinning logo and staggered text |
| Logout animation | Goodbye overlay with auto-navigate |
| Committee animations | Staggered card slide-up, photo pop-in, badge spring, hover glow |
| Committee photos | Circular display with role-coloured gradient background |
| Photo upload | Supabase Storage upload in ManageCommittee, Profile, ManageDocuments |
| Mobile admin link | Admin panel link now visible in mobile nav for admin users |
| Dropdown bug fix | Language & user dropdowns now open correctly |
| i18n snake_case aliases | `vice_president`, `general_secretary` etc. added to all 3 locales |

---

## Phase 4 — Planned (Not Yet Built)

### 4.1 PWA + Push Notifications
- Install as mobile app
- Push notifications for dues, complaint updates, notices
- Implementation: `vite-plugin-pwa` + VAPID keys + `push_subscriptions` table

### 4.2 QR Code Camera Scanning
- Security staff scan visitor QR code via device camera
- Implementation: `html5-qrcode` or `zxing-js`
- Builds on Phase 2.5 visitor system

### 4.3 AI Chatbot
- Resident queries answered instantly ("When is maintenance due?", "How to book hall?")
- Implementation: Claude API via Supabase Edge Function + RAG over colony documents
- Optional: `pgvector` extension for semantic search

### 4.4 SMS Integration (India)
- Payment reminders, complaint updates, visitor gate pass codes via SMS
- Providers: MSG91 (India-specific), Fast2SMS (low cost)
- Implementation: Supabase Edge Function triggered by DB events

### 4.5 Email Broadcasts
- Admin sends bulk email to all residents or a subset
- Implementation: Resend.com (already integrated) + batch send from Edge Function
