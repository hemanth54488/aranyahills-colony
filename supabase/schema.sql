-- ============================================================
-- ARANYA HILLS COLONY WELFARE ASSOCIATION
-- Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor after creating a project
-- ============================================================

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'resident', 'committee', 'security');
CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE plot_status AS ENUM ('occupied', 'vacant', 'under_construction');
CREATE TYPE committee_role AS ENUM (
  'president', 'vice_president', 'general_secretary',
  'joint_secretary', 'treasurer', 'executive_member'
);
CREATE TYPE notice_priority AS ENUM ('urgent', 'general', 'event');
CREATE TYPE service_category AS ENUM (
  'plumber', 'electrician', 'carpenter', 'painter', 'pest_control', 'other'
);
CREATE TYPE document_category AS ENUM (
  'bylaws', 'meeting_minutes', 'financial', 'legal', 'other'
);

-- ============================================================
-- PLOTS (26 plots in the colony)
-- ============================================================
CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_number TEXT UNIQUE NOT NULL,
  area_sqyards NUMERIC(8,2),
  status plot_status NOT NULL DEFAULT 'vacant',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  address_line TEXT,
  house_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  plot_id UUID REFERENCES plots(id),
  role user_role NOT NULL DEFAULT 'resident',
  status account_status NOT NULL DEFAULT 'pending',
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FAMILY MEMBERS (per plot)
-- ============================================================
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT,
  photo_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMITTEE MEMBERS
-- ============================================================
CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  role committee_role NOT NULL,
  year INTEGER NOT NULL,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  profile_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLONY INFO (single row table)
-- ============================================================
CREATE TABLE colony_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  registered_address TEXT,
  founded_year INTEGER,
  total_plots INTEGER DEFAULT 26,
  secretary_phone TEXT,
  secretary_email TEXT,
  about_en TEXT,
  about_te TEXT,
  about_hi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category document_category NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTICES
-- ============================================================
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_te TEXT,
  title_hi TEXT,
  content_en TEXT NOT NULL,
  content_te TEXT,
  content_hi TEXT,
  priority notice_priority DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICE PROVIDERS
-- ============================================================
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category service_category NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is approved
CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PLOTS: everyone can read; only admin can write
CREATE POLICY "plots_read_all" ON plots FOR SELECT USING (TRUE);
CREATE POLICY "plots_insert_admin" ON plots FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "plots_update_admin" ON plots FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "plots_delete_admin" ON plots FOR DELETE USING (is_admin());

-- PROFILES: users can read all approved profiles; can update own; admin has full access
CREATE POLICY "profiles_read_approved" ON profiles FOR SELECT USING (is_approved_user() OR id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_admin());

-- FAMILY MEMBERS: approved users can read; plot owner or admin can write
CREATE POLICY "family_read_approved" ON family_members FOR SELECT USING (is_approved_user());
CREATE POLICY "family_insert_owner" ON family_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plot_id = family_members.plot_id)
  OR is_admin()
);
CREATE POLICY "family_update_admin" ON family_members FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "family_delete_admin" ON family_members FOR DELETE USING (is_admin());

-- COMMITTEE: public read; only admin can write
CREATE POLICY "committee_read_all" ON committee_members FOR SELECT USING (TRUE);
CREATE POLICY "committee_insert_admin" ON committee_members FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "committee_update_admin" ON committee_members FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "committee_delete_admin" ON committee_members FOR DELETE USING (is_admin());

-- COLONY INFO: approved users can read; only admin can write
CREATE POLICY "colony_info_read" ON colony_info FOR SELECT USING (is_approved_user());
CREATE POLICY "colony_info_insert_admin" ON colony_info FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "colony_info_update_admin" ON colony_info FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "colony_info_delete_admin" ON colony_info FOR DELETE USING (is_admin());

-- DOCUMENTS: public docs anyone can read; private docs only approved users; admin writes
CREATE POLICY "docs_read_public" ON documents FOR SELECT USING (is_public = TRUE OR is_approved_user());
CREATE POLICY "docs_insert_admin" ON documents FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "docs_update_admin" ON documents FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "docs_delete_admin" ON documents FOR DELETE USING (is_admin());

-- NOTICES: everyone can read; only admin/committee can write
CREATE POLICY "notices_read_all" ON notices FOR SELECT USING (TRUE);
CREATE POLICY "notices_insert_committee" ON notices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'committee') AND status = 'approved')
);
CREATE POLICY "notices_update_committee" ON notices FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'committee') AND status = 'approved')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'committee') AND status = 'approved')
);
CREATE POLICY "notices_delete_committee" ON notices FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'committee') AND status = 'approved')
);

-- SERVICE PROVIDERS: approved users can read; admin writes
CREATE POLICY "services_read_approved" ON service_providers FOR SELECT USING (is_approved_user());
CREATE POLICY "services_insert_approved" ON service_providers FOR INSERT WITH CHECK (is_approved_user());
CREATE POLICY "services_update_admin" ON service_providers FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "services_delete_admin" ON service_providers FOR DELETE USING (is_admin());

-- ============================================================
-- GRANT PERMISSIONS to anon and authenticated roles
-- (Required when tables are created via SQL Editor)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- SEED: Insert 26 plots
-- ============================================================
INSERT INTO plots (plot_number, status) VALUES
  ('Plot-1', 'vacant'), ('Plot-2', 'vacant'), ('Plot-3', 'vacant'),
  ('Plot-4', 'vacant'), ('Plot-5', 'vacant'), ('Plot-6', 'vacant'),
  ('Plot-7', 'vacant'), ('Plot-8', 'vacant'), ('Plot-9', 'vacant'),
  ('Plot-10', 'vacant'), ('Plot-11', 'vacant'), ('Plot-12', 'vacant'),
  ('Plot-13', 'vacant'), ('Plot-14', 'vacant'), ('Plot-15', 'vacant'),
  ('Plot-16', 'vacant'), ('Plot-17', 'vacant'), ('Plot-18', 'vacant'),
  ('Plot-19', 'vacant'), ('Plot-20', 'vacant'), ('Plot-21', 'vacant'),
  ('Plot-22', 'vacant'), ('Plot-23', 'vacant'), ('Plot-24', 'vacant'),
  ('Plot-25', 'vacant'), ('Plot-26', 'vacant');

-- ============================================================
-- SEED: Colony Info (update with real values)
-- ============================================================
INSERT INTO colony_info (
  bank_name, account_number, ifsc_code, pan_number,
  registered_address, founded_year, total_plots,
  about_en, about_te, about_hi
) VALUES (
  'State Bank of India',
  'XXXXXXXXXXXXXXXXXX',
  'SBIN0XXXXXX',
  'AAACA0000A',
  'Aranya Hills Colony, Badangpet, Hyderabad - 500058, Telangana',
  2020,
  26,
  'Aranya Hills Colony Welfare Association is a registered body dedicated to the maintenance, development, and welfare of residents of Aranya Hills Colony, Badangpet, Hyderabad.',
  'అరణ్య హిల్స్ కాలనీ వెల్ఫేర్ అసోసియేషన్ అనేది హైదరాబాద్, బాదంపేట్‌లోని అరణ్య హిల్స్ కాలనీ నివాసితుల నిర్వహణ, అభివృద్ధి మరియు సంక్షేమానికి అంకితమైన నమోదిత సంస్థ.',
  'अरण्य हिल्स कॉलोनी वेलफेयर एसोसिएशन एक पंजीकृत संस्था है जो हैदराबाद, बादंपेट में अरण्य हिल्स कॉलोनी के निवासियों के रखरखाव, विकास और कल्याण के लिए समर्पित है।'
);
