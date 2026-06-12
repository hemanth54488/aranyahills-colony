# Feature Plan — Aranya Hills Colony Website

## Already Built (Phase 1 — Complete)

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

## Phase 2 — MVP Extension (High Priority)

These six modules cover 80–90% of day-to-day colony needs and should be built next.

### 2.1 Resident Self-Service

**What:** Residents can edit their own profile, upload a house photo, manage family members, and add vehicle records — all via a `/profile` page.

**New pages:** `/profile` (edit contact info, photo upload), `/profile/family`, `/profile/vehicles`

**DB changes:**
```sql
-- Add to profiles table
ALTER TABLE profiles
  ADD COLUMN profile_photo_url TEXT,
  ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- New table: vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES plots(id),
  vehicle_type TEXT CHECK (vehicle_type IN ('car','bike','scooter','truck','other')),
  make_model TEXT,
  registration_number TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- Photo upload via Cloudinary unsigned upload (already used for plots)
- Family members table already exists — just needs a UI for residents to add/edit their own
- Residents can only edit their own plot's data (enforce via RLS)

---

### 2.2 Digital ID Card

**What:** A shareable, printable digital identity card for each approved resident showing name, photo, plot number, role, and QR code.

**New pages:** `/profile/id-card` (view), printable modal with "Download as Image" button

**Implementation:**
- No new DB table — generated from `profiles` + `plots` data
- Use `html2canvas` or `dom-to-image` to export card as PNG
- QR code encodes resident's profile URL or plot number (use `qrcode.react`)

---

### 2.3 Maintenance Fee Management

**What:** Admin creates monthly/quarterly invoices for all plots. Residents view their invoices, mark payments, and download receipts. No payment gateway — manual/UPI reference number recording.

**New pages:**
- `/maintenance` — resident view: outstanding dues, invoice history, mark payment
- `/admin/maintenance` — admin: create invoices in bulk, view payment status per plot, mark payments as verified

**New DB tables:**
```sql
-- Maintenance invoices (one per plot per billing period)
CREATE TABLE maintenance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID REFERENCES plots(id),
  amount NUMERIC(10,2) NOT NULL,
  period TEXT NOT NULL,           -- e.g. "2025-Q1" or "2025-06"
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','waived')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment records against invoices
CREATE TABLE maintenance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES maintenance_invoices(id),
  plot_id UUID REFERENCES plots(id),
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('upi','cash','bank_transfer','cheque')),
  transaction_ref TEXT,
  receipt_url TEXT,               -- Cloudinary if uploaded
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin workflow:** Create invoice → set amount + due date + period → Supabase function bulk-inserts one invoice per occupied plot.
**Resident workflow:** View outstanding invoices → click "Mark as Paid" → enter UPI/transaction reference → admin verifies.

---

### 2.4 Complaints & Service Requests

**What:** Residents raise complaints (water, electricity, security, sanitation, etc.), track status, and rate resolution. Admin/committee assigns and resolves.

**New pages:**
- `/complaints` — resident: raise new, view own complaints with timeline
- `/admin/complaints` — admin: all complaints, filter by status/category, assign & resolve

**New DB tables:**
```sql
CREATE TYPE complaint_category AS ENUM (
  'water','electricity','security','sanitation','roads','garbage',
  'noise','parking','maintenance','other'
);
CREATE TYPE complaint_status AS ENUM ('open','assigned','in_progress','resolved','closed');
CREATE TYPE complaint_priority AS ENUM ('low','medium','high','urgent');

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category complaint_category NOT NULL,
  status complaint_status DEFAULT 'open',
  priority complaint_priority DEFAULT 'medium',
  plot_id UUID REFERENCES plots(id),
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),  -- committee member or staff
  resolution_note TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),  -- resident rates after close
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  status complaint_status,
  note TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- Trigger `updated_at` on complaints via `moddatetime` extension
- Status timeline shown as a stepper/timeline UI on the detail page

---

### 2.5 Facility Booking

**What:** Residents book shared facilities (community hall, clubhouse, sports court, guest house) for specific dates and time slots. Admin approves or rejects.

**New pages:**
- `/facilities` — calendar view + booking form
- `/admin/facilities` — manage bookings (approve/reject/cancel)

**New DB tables:**
```sql
CREATE TYPE facility_type AS ENUM (
  'community_hall','clubhouse','sports_court','guest_house','terrace'
);
CREATE TYPE booking_status AS ENUM ('pending','approved','rejected','cancelled');

CREATE TABLE facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility facility_type NOT NULL,
  plot_id UUID REFERENCES plots(id),
  booked_by UUID REFERENCES profiles(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  attendees_count INT,
  status booking_status DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    facility WITH =,
    tsrange(
      (booking_date + start_time)::TIMESTAMP,
      (booking_date + end_time)::TIMESTAMP
    ) WITH &&
  ) WHERE (status IN ('pending','approved'))
);
```

**Notes:**
- The `EXCLUDE` constraint prevents double-booking at DB level
- Requires `btree_gist` extension: `CREATE EXTENSION IF NOT EXISTS btree_gist;`
- Calendar UI: use `react-big-calendar` or a simple weekly grid

---

### 2.6 Admin Notice Posting UI

**What:** Currently notices exist in DB but there is no admin UI to create/edit/delete them. This is a Phase 1 gap.

**New pages:** `/admin/notices` — create/edit/delete notices with priority, pin, expiry, multilingual content

**DB:** Table already exists — no schema changes needed.

---

## Phase 3 — Community Features

### 3.1 Visitor & Security Management

**What:** Residents pre-approve visitors. Security staff logs entry/exit. Gate pass generated as a QR code.

**New pages:**
- `/visitors` — resident: pre-approve upcoming visitors, view history
- `/security` — security role: scan/enter gate pass code, log entry/exit

**New DB table:**
```sql
CREATE TYPE visitor_status AS ENUM ('pre_approved','entered','exited','expired','denied');

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  purpose TEXT,
  plot_id UUID REFERENCES plots(id),
  approved_by UUID REFERENCES profiles(id),
  expected_date DATE,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  gate_pass_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::TEXT, 1, 8),
  status visitor_status DEFAULT 'pre_approved',
  vehicle_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- `gate_pass_code` is an 8-char token shown as QR code to visitor (via WhatsApp/SMS)
- Security dashboard shows scan field — enter code to log entry/exit
- For Phase 3 start with manual code entry; QR camera scan can come in Phase 4

---

### 3.2 Events Calendar

**What:** Admin/committee posts events; residents view on a calendar.

**New page:** `/events`

**New DB table:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.3 Polls & Surveys

**What:** Admin creates polls; approved residents vote once. Results shown after voting or after poll closes.

**New page:** `/polls`

**New DB tables:**
```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,        -- [{"id":1,"text":"Option A"}, ...]
  ends_at TIMESTAMPTZ,
  show_results TEXT DEFAULT 'after_vote' CHECK (show_results IN ('always','after_vote','after_close')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  voted_by UUID REFERENCES profiles(id),
  option_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, voted_by)    -- one vote per person per poll
);
```

---

### 3.4 Classifieds (Buy / Sell / Rent within Colony)

**What:** Residents post listings for items to sell, rent, or buy within the colony.

**New page:** `/classifieds`

**New DB table:**
```sql
CREATE TYPE classified_type AS ENUM ('sell','buy','rent','service','lost_found');

CREATE TABLE classifieds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type classified_type NOT NULL,
  price NUMERIC(10,2),
  contact_phone TEXT,
  image_url TEXT,
  plot_id UUID REFERENCES plots(id),
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.5 Audit Logs (Admin)

**What:** Track all admin actions (approvals, rejections, edits) for accountability.

**New page:** `/admin/audit-logs`

**New DB table:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,           -- e.g. 'APPROVE_RESIDENT', 'DELETE_NOTICE'
  entity_type TEXT,               -- 'profiles', 'plots', 'complaints', etc.
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation:** Insert into `audit_logs` inside each admin mutation function.

---

### 3.6 Document Downloads

**What:** Residents can browse and download AGM minutes, financial reports, bylaws, forms.

**New page:** `/documents` (currently only shown inside `/colony-info`)

**DB:** `documents` table already exists. Needs admin UI to upload (via Cloudinary).

---

## Phase 4 — Advanced Features

### 4.1 PWA + Push Notifications

**What:** Install the site as an app on mobile. Receive push notifications for new notices, complaint updates, payment dues.

**Implementation:**
- Add `vite-plugin-pwa` to generate service worker and manifest
- Web Push API via Supabase Edge Functions + VAPID keys
- Store push subscriptions in a new `push_subscriptions` table

---

### 4.2 QR Code Visitor Entry

**What:** Security scans visitor's QR code via device camera to log entry/exit without typing the code.

**Implementation:**
- Use `html5-qrcode` or `zxing-js` for camera-based scanning
- Works on mobile browser (security staff phone/tablet)
- Builds on the visitor management system from Phase 3.1

---

### 4.3 AI Chatbot (Azure OpenAI / Claude API)

**What:** Residents can ask questions ("When is the next maintenance due?", "How do I book the community hall?") and get instant answers.

**Implementation options:**
- Claude API (Anthropic) — `@anthropic-ai/sdk` in a Supabase Edge Function
- Azure OpenAI — suited if team has Azure subscription
- RAG over colony documents: embed bylaws + FAQ into Supabase `pgvector` table for grounded answers
- Embed as a floating chat widget on all pages

---

### 4.4 SMS Integration

**What:** Send SMS for payment reminders, complaint updates, visitor gate pass codes.

**Provider options (India):**
- **Twilio** — widely used, reliable
- **MSG91** — India-specific, cheaper
- **Fast2SMS** — low-cost free tier for testing

**Implementation:** Supabase Edge Function triggered by DB events (payment due, complaint status change).

---

### 4.5 Email Broadcasts

**What:** Admin composes and sends bulk emails to all residents or a subset (e.g., only plot owners, only pending payments).

**Implementation:** Resend.com (already integrated) + batch send from Supabase Edge Function.

---

## Summary: New DB Tables by Phase

| Phase | New Tables |
|---|---|
| 2 | `vehicles`, `maintenance_invoices`, `maintenance_payments`, `complaints`, `complaint_updates`, `facility_bookings` |
| 3 | `visitors`, `events`, `polls`, `poll_votes`, `classifieds`, `audit_logs` |
| 4 | `push_subscriptions` (+ `pgvector` extension for AI RAG) |

## Summary: New Routes by Phase

| Phase | New Routes |
|---|---|
| 2 | `/profile`, `/profile/family`, `/profile/vehicles`, `/profile/id-card`, `/maintenance`, `/complaints`, `/complaints/:id`, `/facilities`, `/admin/maintenance`, `/admin/complaints`, `/admin/facilities`, `/admin/notices` |
| 3 | `/visitors`, `/security`, `/events`, `/polls`, `/classifieds`, `/documents`, `/admin/audit-logs` |
| 4 | (floating chat widget, no new route; PWA is config-only) |
