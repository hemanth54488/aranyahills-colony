# Database Design

## Overview

The database is hosted on **Supabase (PostgreSQL)** with Row Level Security (RLS) enabled on all tables.

- **Project:** aranyahills-colony
- **Region:** Asia Pacific (Singapore)
- **Total Tables:** 20 (8 original + 12 added in Phase 2/3)
- **Total Plots Seeded:** 26
- **Storage Bucket:** `colony-files` (public, 5 MB limit per file)

---

## Schema Files

| File | Tables | Run Order |
|---|---|---|
| `supabase/schema.sql` | 8 original tables + seed data | 1st |
| `supabase/schema_v2.sql` | 12 new feature tables | 2nd |
| `supabase/setup_storage.sql` | Supabase Storage bucket + policies | 3rd |
| `supabase/seed_committee.sql` | 2026 committee members | After schema_v2 |

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
    |
    | 1:1 (trigger on insert)
    v
profiles
    |-- plot_id -----------> plots
    |                           |-- family_members
    |                           |-- maintenance_invoices --> maintenance_payments
    |                           |-- facility_bookings
    |                           |-- visitors
    |                           |-- classifieds
    |                           |-- vehicles
    |
    |-- committee_members (optional profile_id link)
    |-- notices (created_by)
    |-- documents (uploaded_by)
    |-- service_providers (added_by)
    |-- complaints (created_by, assigned_to)
    |       |-- complaint_updates
    |-- events (created_by)
    |-- polls (created_by)
    |       |-- poll_votes (voted_by)
    |-- audit_logs (actor_id)
    |
colony_info (single row)
```

---

## Original Tables (schema.sql)

### 1. profiles
Extends Supabase auth.users with colony-specific data.

| Column | Type | Description |
|---|---|---|
| id | UUID | FK to auth.users(id) |
| full_name | TEXT | Resident full name |
| email | TEXT | Email address |
| phone | TEXT | 10-digit mobile number |
| plot_id | UUID | FK to plots(id) |
| role | user_role | admin / resident / committee / security |
| status | account_status | pending / approved / rejected |
| preferred_language | TEXT | en / te / hi |
| avatar_url | TEXT | Profile photo (Supabase Storage URL) |
| created_at | TIMESTAMPTZ | Registration time |
| updated_at | TIMESTAMPTZ | Last update time |

### 2. plots
The 26 plots in Aranya Hills Colony.

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| plot_number | TEXT | Unique (Plot-1 to Plot-26) |
| area_sqyards | NUMERIC(8,2) | Plot area |
| status | plot_status | occupied / vacant / under_construction |
| latitude | NUMERIC(10,7) | GPS latitude |
| longitude | NUMERIC(10,7) | GPS longitude |
| address_line | TEXT | Street address |
| house_photo_url | TEXT | House photo URL |

### 3. committee_members
Annual elected committee. `is_active=false` = past committee.

| Column | Type | Description |
|---|---|---|
| full_name | TEXT | Member name |
| role | committee_role | president / vice_president / general_secretary / joint_secretary / treasurer / executive_member |
| year | INTEGER | Election year |
| phone | TEXT | Contact |
| email | TEXT | Email |
| photo_url | TEXT | Supabase Storage photo URL |
| is_active | BOOLEAN | TRUE = current committee |

### 4. family_members
Household members per plot.

### 5. colony_info
Single-row table: bank details, PAN, address, about text (EN/TE/HI).

### 6. notices
Announcements. Trilingual (EN/TE/HI), priority levels, pin and expiry support.

### 7. documents
Colony documents. `is_public=FALSE` means members-only. Files stored in Supabase Storage (`colony-files` bucket).

### 8. service_providers
Plumbers, electricians, etc. Added by approved residents.

---

## New Tables (schema_v2.sql)

### 9. vehicles
Resident vehicle registrations per profile.

| Column | Type | Description |
|---|---|---|
| profile_id | UUID | FK to profiles |
| plot_id | UUID | FK to plots |
| vehicle_type | TEXT | car / bike / scooter / truck / other |
| make_model | TEXT | e.g. Maruti Swift |
| registration_number | TEXT | e.g. TS09AB1234 |
| color | TEXT | Vehicle colour |

### 10. maintenance_invoices
Monthly/quarterly fee invoices created by admin per plot.

| Column | Type | Description |
|---|---|---|
| plot_id | UUID | FK to plots |
| amount | NUMERIC(10,2) | Invoice amount (must be > 0) |
| period | TEXT | e.g. "2025-Q1" or "2026-06" |
| due_date | DATE | Payment deadline |
| status | TEXT | pending / paid / overdue / waived |
| notes | TEXT | Optional admin notes |
| created_by | UUID | FK to profiles (admin) |

### 11. maintenance_payments
Payment records against invoices.

| Column | Type | Description |
|---|---|---|
| invoice_id | UUID | FK to maintenance_invoices |
| plot_id | UUID | FK to plots |
| amount_paid | NUMERIC(10,2) | Amount paid |
| payment_date | DATE | Date of payment |
| payment_mode | TEXT | upi / cash / bank_transfer / cheque |
| transaction_ref | TEXT | UPI ref / cheque number |
| verified_by | UUID | FK to profiles (admin who verified) |
| verified_at | TIMESTAMPTZ | When admin verified |

### 12. complaints
Resident complaints and service requests.

| Column | Type | Description |
|---|---|---|
| title | TEXT | Brief issue title |
| description | TEXT | Detailed description |
| category | complaint_category | water / electricity / security / sanitation / roads / garbage / noise / parking / maintenance / other |
| status | complaint_status | open / assigned / in_progress / resolved / closed |
| priority | complaint_priority | low / medium / high / urgent |
| plot_id | UUID | Complainant's plot |
| created_by | UUID | FK to profiles |
| assigned_to | UUID | FK to profiles (committee member) |
| resolution_note | TEXT | How it was resolved |
| rating | SMALLINT | 1–5 stars (resident rates after close) |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

### 13. complaint_updates
Status update timeline for each complaint.

| Column | Type | Description |
|---|---|---|
| complaint_id | UUID | FK to complaints |
| status | complaint_status | New status at this update |
| note | TEXT | Update note from committee |
| updated_by | UUID | FK to profiles |

### 14. facility_bookings
Bookings for community hall, clubhouse, sports court, guest house, terrace.

| Column | Type | Description |
|---|---|---|
| facility | facility_type | community_hall / clubhouse / sports_court / guest_house / terrace |
| plot_id | UUID | Booker's plot |
| booked_by | UUID | FK to profiles |
| booking_date | DATE | Date of booking |
| start_time | TIME | Start time |
| end_time | TIME | End time (must be after start) |
| purpose | TEXT | Reason for booking |
| attendees_count | INT | Approx. number of people |
| status | booking_status | pending / approved / rejected / cancelled |
| rejection_reason | TEXT | Reason if rejected |
| approved_by | UUID | FK to profiles (admin) |

### 15. visitors
Visitor pre-approvals and gate pass management.

| Column | Type | Description |
|---|---|---|
| visitor_name | TEXT | Visitor's full name |
| visitor_phone | TEXT | Visitor's phone |
| purpose | TEXT | Reason for visit |
| plot_id | UUID | Which plot they're visiting |
| approved_by | UUID | Resident who pre-approved |
| expected_date | DATE | Planned visit date |
| entry_time | TIMESTAMPTZ | Logged by security |
| exit_time | TIMESTAMPTZ | Logged by security |
| gate_pass_code | TEXT | 8-char unique code (auto-generated) |
| status | visitor_status | pre_approved / entered / exited / expired / denied |
| vehicle_number | TEXT | Visitor's vehicle |

### 16. events
Colony events calendar.

| Column | Type | Description |
|---|---|---|
| title | TEXT | Event name |
| description | TEXT | Details |
| event_date | DATE | Date of event |
| start_time | TIME | Optional start time |
| end_time | TIME | Optional end time |
| location | TEXT | Venue |
| image_url | TEXT | Event banner image |
| created_by | UUID | FK to profiles |

**RLS:** Public read (no login required).

### 17. polls
Community polls and surveys.

| Column | Type | Description |
|---|---|---|
| title | TEXT | Poll question |
| description | TEXT | Additional context |
| options | JSONB | Array of `{id, text}` objects |
| ends_at | TIMESTAMPTZ | Poll close time (NULL = open indefinitely) |
| show_results | TEXT | always / after_vote / after_close |
| created_by | UUID | FK to profiles |

### 18. poll_votes
One vote per resident per poll (UNIQUE constraint enforced).

| Column | Type | Description |
|---|---|---|
| poll_id | UUID | FK to polls |
| voted_by | UUID | FK to profiles |
| option_id | INT | Selected option ID from options JSONB |

**Constraint:** `UNIQUE(poll_id, voted_by)` — prevents double voting.

### 19. classifieds
Buy/sell/rent listings within the colony.

| Column | Type | Description |
|---|---|---|
| title | TEXT | Listing title |
| description | TEXT | Details |
| type | classified_type | sell / buy / rent / service / lost_found |
| price | NUMERIC(10,2) | Optional price |
| contact_phone | TEXT | Seller/poster contact |
| image_url | TEXT | Photo URL |
| is_active | BOOLEAN | FALSE = sold/done |
| expires_at | TIMESTAMPTZ | Optional expiry |
| created_by | UUID | FK to profiles |

### 20. audit_logs
Admin action trail.

| Column | Type | Description |
|---|---|---|
| actor_id | UUID | FK to profiles (who did it) |
| action | TEXT | e.g. APPROVE_RESIDENT, DELETE_NOTICE |
| entity_type | TEXT | Table affected |
| entity_id | UUID | Row affected |
| old_data | JSONB | Previous state |
| new_data | JSONB | New state |

---

## Triggers

### handle_new_user()
Auto-creates a `profiles` row when a user signs up via Supabase Auth.

### update_complaints_updated_at()
Auto-updates `complaints.updated_at` on every UPDATE.

---

## Row Level Security (RLS) Summary

### Original tables
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| plots | Everyone | Admin | Admin | Admin |
| profiles | Approved + own | Trigger only | Own + Admin | Admin |
| family_members | Approved | Plot owner + Admin | Admin | Admin |
| committee_members | Everyone | Admin | Admin | Admin |
| colony_info | Approved | Admin | Admin | Admin |
| documents | Public or Approved | Admin | Admin | Admin |
| notices | Everyone | Committee + Admin | Committee + Admin | Committee + Admin |
| service_providers | Approved | Approved | Admin | Admin |

### New tables (schema_v2)
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| vehicles | Approved | Own + Admin | Own + Admin | Own + Admin |
| maintenance_invoices | Own plot + Admin | Admin | Admin | Admin |
| maintenance_payments | Own plot + Admin | Own + Admin | Admin | Admin |
| complaints | Approved | Own (created_by) | Own + Committee | Admin |
| complaint_updates | Approved | Committee + Owner | — | — |
| facility_bookings | Approved | Own (booked_by) | Own + Admin | Admin |
| visitors | Approved | Own (approved_by) | Own + Security + Admin | Own + Admin |
| events | Everyone | Committee + Admin | Committee + Admin | Admin |
| polls | Approved | Committee + Admin | Committee + Admin | Admin |
| poll_votes | Approved | Own (voted_by) | — | — |
| classifieds | Approved | Own (created_by) | Own + Admin | Own + Admin |
| audit_logs | Admin | Approved | — | — |

---

## Supabase Storage

**Bucket:** `colony-files` (public)

| Folder | Usage |
|---|---|
| `photos/` | Committee member photos, profile avatars |
| `documents/` | Colony PDFs, Word docs, letterheads |

**Policies:**
- Public read (anyone can view/download)
- Authenticated upload/update/delete

**File size limit:** 5 MB per file
**Allowed types:** JPEG, PNG, WebP, GIF, PDF, DOC, DOCX

---

## Database Statistics

| Metric | Value |
|---|---|
| Total Tables | 20 |
| Original Tables (schema.sql) | 8 |
| New Tables (schema_v2.sql) | 12 |
| Total Enum Types | 12 |
| Total Triggers | 2 |
| Total Helper Functions | 2 |
| Total RLS Policies | ~50 |
| Seeded Plots | 26 |
| Storage Bucket | 1 (colony-files) |
| Free Tier Limits | 500MB DB, 1GB Storage, 50k rows |
