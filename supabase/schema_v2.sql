-- ============================================================
-- ARANYA HILLS COLONY - Schema V2 (New Features)
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES plots(id),
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car','bike','scooter','truck','other')),
  make_model TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_read_approved" ON vehicles FOR SELECT USING (is_approved_user());
CREATE POLICY "vehicles_insert_own" ON vehicles FOR INSERT WITH CHECK (profile_id = auth.uid() OR is_admin());
CREATE POLICY "vehicles_update_own" ON vehicles FOR UPDATE USING (profile_id = auth.uid() OR is_admin());
CREATE POLICY "vehicles_delete_own" ON vehicles FOR DELETE USING (profile_id = auth.uid() OR is_admin());

-- ============================================================
-- MAINTENANCE INVOICES
-- ============================================================
CREATE TABLE maintenance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','waived')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_read_own_or_admin" ON maintenance_invoices FOR SELECT USING (
  is_admin() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plot_id = maintenance_invoices.plot_id AND status = 'approved')
);
CREATE POLICY "invoices_insert_admin" ON maintenance_invoices FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "invoices_update_admin" ON maintenance_invoices FOR UPDATE USING (is_admin());
CREATE POLICY "invoices_delete_admin" ON maintenance_invoices FOR DELETE USING (is_admin());

-- ============================================================
-- MAINTENANCE PAYMENTS
-- ============================================================
CREATE TABLE maintenance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES maintenance_invoices(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES plots(id),
  amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
  payment_date DATE NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('upi','cash','bank_transfer','cheque')),
  transaction_ref TEXT,
  receipt_url TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_read_own_or_admin" ON maintenance_payments FOR SELECT USING (
  is_admin() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plot_id = maintenance_payments.plot_id AND status = 'approved')
);
CREATE POLICY "payments_insert_approved" ON maintenance_payments FOR INSERT WITH CHECK (
  is_admin() OR
  (is_approved_user() AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN maintenance_invoices mi ON mi.plot_id = p.plot_id
    WHERE p.id = auth.uid() AND mi.id = maintenance_payments.invoice_id
  ))
);
CREATE POLICY "payments_update_admin" ON maintenance_payments FOR UPDATE USING (is_admin());
CREATE POLICY "payments_delete_admin" ON maintenance_payments FOR DELETE USING (is_admin());

-- ============================================================
-- COMPLAINTS
-- ============================================================
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
  status complaint_status NOT NULL DEFAULT 'open',
  priority complaint_priority NOT NULL DEFAULT 'medium',
  plot_id UUID REFERENCES plots(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  resolution_note TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status complaint_status NOT NULL,
  note TEXT,
  updated_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "complaints_read_approved" ON complaints FOR SELECT USING (is_approved_user());
CREATE POLICY "complaints_insert_approved" ON complaints FOR INSERT WITH CHECK (is_approved_user() AND created_by = auth.uid());
CREATE POLICY "complaints_update_own_or_committee" ON complaints FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
);
CREATE POLICY "complaints_delete_admin" ON complaints FOR DELETE USING (is_admin());

CREATE POLICY "cupdates_read_approved" ON complaint_updates FOR SELECT USING (is_approved_user());
CREATE POLICY "cupdates_insert_committee_or_owner" ON complaint_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
  OR EXISTS (SELECT 1 FROM complaints WHERE id = complaint_updates.complaint_id AND created_by = auth.uid())
);

-- Auto-update updated_at on complaints
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_complaints_updated_at();

-- ============================================================
-- FACILITY BOOKINGS
-- ============================================================
CREATE TYPE facility_type AS ENUM (
  'community_hall','clubhouse','sports_court','guest_house','terrace'
);
CREATE TYPE booking_status AS ENUM ('pending','approved','rejected','cancelled');

CREATE TABLE facility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility facility_type NOT NULL,
  plot_id UUID REFERENCES plots(id),
  booked_by UUID NOT NULL REFERENCES profiles(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT,
  attendees_count INT CHECK (attendees_count > 0),
  status booking_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT booking_end_after_start CHECK (end_time > start_time)
);

ALTER TABLE facility_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_read_approved" ON facility_bookings FOR SELECT USING (is_approved_user());
CREATE POLICY "bookings_insert_approved" ON facility_bookings FOR INSERT WITH CHECK (is_approved_user() AND booked_by = auth.uid());
CREATE POLICY "bookings_update_own_or_admin" ON facility_bookings FOR UPDATE USING (
  booked_by = auth.uid() OR is_admin()
);
CREATE POLICY "bookings_delete_admin" ON facility_bookings FOR DELETE USING (is_admin());

-- ============================================================
-- VISITORS
-- ============================================================
CREATE TYPE visitor_status AS ENUM ('pre_approved','entered','exited','expired','denied');

CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  purpose TEXT,
  plot_id UUID NOT NULL REFERENCES plots(id),
  approved_by UUID NOT NULL REFERENCES profiles(id),
  expected_date DATE NOT NULL,
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  gate_pass_code TEXT UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::TEXT,'-',''),1,8)),
  status visitor_status NOT NULL DEFAULT 'pre_approved',
  vehicle_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visitors_read_approved" ON visitors FOR SELECT USING (is_approved_user());
CREATE POLICY "visitors_insert_approved" ON visitors FOR INSERT WITH CHECK (is_approved_user() AND approved_by = auth.uid());
CREATE POLICY "visitors_update_own_or_security" ON visitors FOR UPDATE USING (
  approved_by = auth.uid() OR is_admin() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'security' AND status = 'approved')
);
CREATE POLICY "visitors_delete_own" ON visitors FOR DELETE USING (approved_by = auth.uid() OR is_admin());

-- ============================================================
-- EVENTS
-- ============================================================
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

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_read_all" ON events FOR SELECT USING (TRUE);
CREATE POLICY "events_insert_committee" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
);
CREATE POLICY "events_update_committee" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
);
CREATE POLICY "events_delete_admin" ON events FOR DELETE USING (is_admin());

-- ============================================================
-- POLLS
-- ============================================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  ends_at TIMESTAMPTZ,
  show_results TEXT NOT NULL DEFAULT 'after_vote' CHECK (show_results IN ('always','after_vote','after_close')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voted_by UUID NOT NULL REFERENCES profiles(id),
  option_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, voted_by)
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_read_approved" ON polls FOR SELECT USING (is_approved_user());
CREATE POLICY "polls_insert_committee" ON polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
);
CREATE POLICY "polls_update_committee" ON polls FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','committee') AND status = 'approved')
);
CREATE POLICY "polls_delete_admin" ON polls FOR DELETE USING (is_admin());

CREATE POLICY "votes_read_all" ON poll_votes FOR SELECT USING (is_approved_user());
CREATE POLICY "votes_insert_approved" ON poll_votes FOR INSERT WITH CHECK (is_approved_user() AND voted_by = auth.uid());

-- ============================================================
-- CLASSIFIEDS
-- ============================================================
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
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classifieds_read_approved" ON classifieds FOR SELECT USING (is_approved_user());
CREATE POLICY "classifieds_insert_approved" ON classifieds FOR INSERT WITH CHECK (is_approved_user() AND created_by = auth.uid());
CREATE POLICY "classifieds_update_own" ON classifieds FOR UPDATE USING (created_by = auth.uid() OR is_admin());
CREATE POLICY "classifieds_delete_own" ON classifieds FOR DELETE USING (created_by = auth.uid() OR is_admin());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_admin" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "audit_insert_approved" ON audit_logs FOR INSERT WITH CHECK (is_approved_user());

-- ============================================================
-- GRANT PERMISSIONS for new tables
-- ============================================================
GRANT ALL ON TABLE vehicles TO anon, authenticated;
GRANT ALL ON TABLE maintenance_invoices TO anon, authenticated;
GRANT ALL ON TABLE maintenance_payments TO anon, authenticated;
GRANT ALL ON TABLE complaints TO anon, authenticated;
GRANT ALL ON TABLE complaint_updates TO anon, authenticated;
GRANT ALL ON TABLE facility_bookings TO anon, authenticated;
GRANT ALL ON TABLE visitors TO anon, authenticated;
GRANT ALL ON TABLE events TO anon, authenticated;
GRANT ALL ON TABLE polls TO anon, authenticated;
GRANT ALL ON TABLE poll_votes TO anon, authenticated;
GRANT ALL ON TABLE classifieds TO anon, authenticated;
GRANT ALL ON TABLE audit_logs TO anon, authenticated;
