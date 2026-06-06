# Database Design

## Overview

The database is hosted on **Supabase (PostgreSQL)** with Row Level Security (RLS) enabled on all tables.

- **Project:** aranyahills-colony
- **Region:** Asia Pacific (Singapore)
- **Total Tables:** 8
- **Total Plots Seeded:** 26

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
    |
    | 1:1 (trigger on insert)
    v
profiles
    |-- plot_id --> plots (1 plot per resident)
    |
    |
plots
    |-- family_members (1 plot : many family members)
    |
    |
committee_members
    |-- profile_id --> profiles (optional link)
    |
    |
notices
    |-- created_by --> profiles
    |
    |
documents
    |-- uploaded_by --> profiles
    |
    |
service_providers
    |-- added_by --> profiles
    |
    |
colony_info (single row configuration table)
```

---

## Tables

### 1. profiles
Extends Supabase auth.users with colony-specific data.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | UUID | NO | - | FK to auth.users(id) |
| full_name | TEXT | NO | - | Resident full name |
| email | TEXT | YES | - | Email address |
| phone | TEXT | YES | - | 10-digit mobile number |
| plot_id | UUID | YES | - | FK to plots(id) |
| role | user_role | NO | 'resident' | User role enum |
| status | account_status | NO | 'pending' | Approval status |
| preferred_language | TEXT | YES | 'en' | en / te / hi |
| avatar_url | TEXT | YES | - | Profile photo URL |
| created_at | TIMESTAMPTZ | NO | NOW() | Registration time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |

**Enums:**
```sql
user_role: 'admin' | 'resident' | 'committee' | 'security'
account_status: 'pending' | 'approved' | 'rejected'
```

---

### 2. plots
The 26 plots in Aranya Hills Colony.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | Primary key |
| plot_number | TEXT | NO | - | Unique plot identifier (Plot-1 to Plot-26) |
| area_sqyards | NUMERIC(8,2) | YES | - | Plot area in square yards |
| status | plot_status | NO | 'vacant' | Current status |
| latitude | NUMERIC(10,7) | YES | - | GPS latitude for Google Maps |
| longitude | NUMERIC(10,7) | YES | - | GPS longitude for Google Maps |
| address_line | TEXT | YES | - | Street address within colony |
| house_photo_url | TEXT | YES | - | Cloudinary photo URL |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation time |

**Enums:**
```sql
plot_status: 'occupied' | 'vacant' | 'under_construction'
```

**Seed Data:** Plots 1-26 all created with status='vacant' on initial setup.

---

### 3. committee_members
Annual elected committee. New records added each year; old ones archived.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | Primary key |
| full_name | TEXT | NO | - | Member full name |
| role | committee_role | NO | - | Committee position |
| year | INTEGER | NO | - | Election year (e.g. 2025) |
| phone | TEXT | YES | - | Contact number |
| email | TEXT | YES | - | Email address |
| photo_url | TEXT | YES | - | Cloudinary photo URL |
| profile_id | UUID | YES | - | FK to profiles (if registered) |
| is_active | BOOLEAN | NO | TRUE | Current vs. past committee |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation time |

**Enums:**
```sql
committee_role:
  'president' | 'vice_president' | 'general_secretary' |
  'joint_secretary' | 'treasurer' | 'executive_member'
```

**Annual Election Cycle:**
1. New year: Admin archives old committee (is_active = false)
2. Admin adds new members with new year
3. Past committees visible under "Past / Archived" tab

---

### 4. family_members
Family members per plot (residents can add their household).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | Primary key |
| plot_id | UUID | NO | - | FK to plots(id) ON DELETE CASCADE |
| name | TEXT | NO | - | Family member name |
| relation | TEXT | YES | - | Relation to owner (Spouse, Son, etc.) |
| photo_url | TEXT | YES | - | Photo URL |
| phone | TEXT | YES | - | Contact number |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation time |

---

### 5. colony_info
Single-row configuration table for colony details.

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID | NO | Primary key |
| bank_name | TEXT | YES | Bank name for colony account |
| account_number | TEXT | YES | Bank account number |
| ifsc_code | TEXT | YES | IFSC code |
| pan_number | TEXT | YES | PAN card number |
| registered_address | TEXT | YES | Official registered address |
| founded_year | INTEGER | YES | Year association was founded |
| total_plots | INTEGER | YES | Total number of plots (26) |
| secretary_phone | TEXT | YES | Secretary contact |
| secretary_email | TEXT | YES | Secretary email |
| about_en | TEXT | YES | About text in English |
| about_te | TEXT | YES | About text in Telugu |
| about_hi | TEXT | YES | About text in Hindi |
| created_at | TIMESTAMPTZ | NO | - |
| updated_at | TIMESTAMPTZ | NO | - |

---

### 6. notices
Announcements posted by admin/committee.

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID | NO | Primary key |
| title_en | TEXT | NO | Title in English |
| title_te | TEXT | YES | Title in Telugu |
| title_hi | TEXT | YES | Title in Hindi |
| content_en | TEXT | NO | Content in English |
| content_te | TEXT | YES | Content in Telugu |
| content_hi | TEXT | YES | Content in Hindi |
| priority | notice_priority | NO | Urgency level |
| is_pinned | BOOLEAN | NO | Show at top |
| expires_at | TIMESTAMPTZ | YES | Auto-hide after this date |
| created_by | UUID | YES | FK to profiles(id) |
| created_at | TIMESTAMPTZ | NO | - |

**Enums:**
```sql
notice_priority: 'urgent' | 'general' | 'event'
```

---

### 7. documents
Colony documents (bylaws, meeting minutes, financial reports).

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID | NO | Primary key |
| name | TEXT | NO | Document name |
| category | document_category | NO | Document type |
| file_url | TEXT | NO | Cloudinary file URL |
| is_public | BOOLEAN | NO | FALSE = approved users only |
| uploaded_by | UUID | YES | FK to profiles(id) |
| created_at | TIMESTAMPTZ | NO | - |

**Enums:**
```sql
document_category: 'bylaws' | 'meeting_minutes' | 'financial' | 'legal' | 'other'
```

---

### 8. service_providers
Plumbers, electricians, etc. available for colony residents.

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | UUID | NO | Primary key |
| name | TEXT | NO | Provider name |
| category | service_category | NO | Service type |
| phone | TEXT | NO | Primary contact |
| alternate_phone | TEXT | YES | Alternate contact |
| address | TEXT | YES | Service area |
| is_available | BOOLEAN | NO | Currently available |
| added_by | UUID | YES | FK to profiles(id) |
| created_at | TIMESTAMPTZ | NO | - |

**Enums:**
```sql
service_category:
  'plumber' | 'electrician' | 'carpenter' |
  'painter' | 'pest_control' | 'other'
```

---

## Triggers

### handle_new_user()
Fires automatically when a user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Row Level Security (RLS) Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| plots | Everyone | Admin only | Admin only | Admin only |
| profiles | Approved users + own | Own (trigger) | Own + Admin | Admin only |
| family_members | Approved users | Plot owner + Admin | Admin only | Admin only |
| committee_members | Everyone | Admin only | Admin only | Admin only |
| colony_info | Approved users | Admin only | Admin only | Admin only |
| documents | Public or Approved | Admin only | Admin only | Admin only |
| notices | Everyone | Committee + Admin | Committee + Admin | Committee + Admin |
| service_providers | Approved users | Approved users | Admin only | Admin only |

---

## Helper Functions

```sql
-- Check if current user is an approved resident
CREATE FUNCTION is_approved_user() RETURNS BOOLEAN
-- Returns TRUE if auth.uid() exists in profiles with status='approved'

-- Check if current user is admin
CREATE FUNCTION is_admin() RETURNS BOOLEAN
-- Returns TRUE if auth.uid() exists in profiles with role='admin' AND status='approved'
```

---

## Database Statistics
| Metric | Value |
|---|---|
| Total Tables | 8 |
| Total Enum Types | 6 |
| Total Triggers | 1 |
| Total Functions | 3 |
| Total RLS Policies | 22 |
| Seeded Plots | 26 |
| Free Tier Limits | 500MB storage, 50,000 rows |
