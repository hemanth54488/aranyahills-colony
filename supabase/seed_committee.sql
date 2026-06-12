-- ============================================================
-- ARANYA HILLS COLONY - Committee Members Seed
-- Run this in your Supabase SQL Editor
-- Photos are placeholder avatars — replace photo_url with
-- real Cloudinary/Drive URLs when available.
-- ============================================================

-- Clear existing active committee members first (optional)
-- UPDATE committee_members SET is_active = FALSE WHERE is_active = TRUE;

INSERT INTO committee_members (full_name, role, year, phone, email, photo_url, is_active) VALUES

  -- President
  (
    'Kondal Reddy D',
    'president',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Kondal+Reddy&background=15803d&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Vice President
  (
    'Mahendar Reddy T',
    'vice_president',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Mahendar+Reddy&background=166534&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- General Secretary
  (
    'Hemanth Kumar Reddy T',
    'general_secretary',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Hemanth+Kumar&background=14532d&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Joint Secretary
  (
    'Rajendar Reddy K',
    'joint_secretary',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Rajendar+Reddy&background=d97706&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Treasurer
  (
    'Sandeep Ch',
    'treasurer',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Sandeep+Ch&background=15803d&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Executive Member 1
  (
    'Aravind Reddy B',
    'executive_member',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Aravind+Reddy&background=166534&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Executive Member 2
  (
    'Rameshwar Sangwa',
    'executive_member',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Rameshwar+Sangwa&background=14532d&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  ),

  -- Executive Member 3
  (
    'Praneeth Rao R',
    'executive_member',
    2026,
    NULL,
    NULL,
    'https://ui-avatars.com/api/?name=Praneeth+Rao&background=d97706&color=fff&bold=true&size=200&rounded=true&font-size=0.40',
    TRUE
  );

-- ============================================================
-- Letterhead document entry
-- Replace the file_url below with the actual hosted image URL
-- (upload the letterhead to Google Drive / Cloudinary first)
-- ============================================================
INSERT INTO documents (name, category, file_url, is_public) VALUES
  (
    'AHCWA Official Letterhead 2026',
    'legal',
    'https://placeholder.com/letterhead-replace-this-url',
    FALSE
  );
