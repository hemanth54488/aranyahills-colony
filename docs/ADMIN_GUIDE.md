# Admin Guide

## For the Secretary / Technical Admin

This guide explains how to manage the Aranya Hills Colony website. No coding knowledge required.

---

## Logging In

1. Go to https://aranyahillscolony.in/login
2. Enter your email and password
3. Click Login
4. You will see your name in the top-right corner

---

## Accessing the Admin Panel

After login:
- Click your name in the top-right corner
- Click "Admin Panel"
- OR go directly to: https://aranyahillscolony.in/admin

---

## 1. Approving New Registrations

When a resident registers, you will see a notification on the Admin Dashboard.

### Steps:
1. Go to Admin Panel
2. Click "Pending Registrations"
3. You will see a list of people waiting for approval
4. For each person:
   - Review their name, plot number, phone
   - Click "Approve" to grant access
   - Click "Reject" to deny (if unknown person)
5. The resident gets an email notification

### Important:
- Only approve residents you know from Aranya Hills Colony
- Rejected residents can register again with different details

---

## 2. Managing Committee Members

### Add a New Committee Member:
1. Admin Panel > "Manage Committee"
2. Click "+ Add Member" button
3. Fill in the form:
   - Full Name (required)
   - Role: President / Vice President / etc. (required)
   - Year: 2025 or 2026 (required)
   - Phone: 10-digit mobile number (optional)
   - Email: their email address (optional)
   - Photo URL: from Cloudinary (optional, can add later)
4. Click "Add Member"

### Archive Old Committee (After Elections):
1. Admin Panel > "Manage Committee"
2. For each outgoing member, click "Archive"
3. Confirm in the dialog
4. They move to "Past / Archived" tab
5. Add new committee members for the new year

### Delete a Member Permanently:
1. Click the red trash icon next to any member
2. Confirm in the dialog
3. This cannot be undone

---

## 3. Managing Plots

### Update Plot Information:
1. Admin Panel > "Manage Plots"
2. You will see all 26 plots listed
3. Click "Edit" next to any plot
4. Update the fields:
   - Plot Number: e.g. Plot-5
   - Status: Vacant / Occupied / Under Construction
   - Area (Sq. Yards): e.g. 200
   - Address: Street address within colony
   - Latitude/Longitude: GPS coordinates from Google Maps
   - House Photo URL: from Cloudinary
5. Click "Save Changes"

### How to get GPS coordinates from Google Maps:
1. Open https://maps.google.com
2. Find the plot location in Badangpet
3. Right-click on the exact location
4. The first line shows the coordinates (e.g. 17.3265, 78.5312)
5. First number = Latitude, Second = Longitude
6. Copy and paste into the form

---

## 4. Posting Notices

(Phase 2 feature - coming soon)

Notices will be posted from the Admin Panel and sent to all residents.

---

## 5. Uploading Photos (Cloudinary)

Photos are hosted on Cloudinary (free). To get a photo URL:

1. Go to https://cloudinary.com and login
2. Click "Upload" in the Media Library
3. Upload the photo
4. Right-click on the uploaded photo > Copy URL
5. Paste that URL in the Photo URL field in the website

---

## 6. Colony Information

To update bank details, PAN number, bylaws:

1. This is currently done directly in Supabase
2. Go to https://supabase.com
3. Table Editor > colony_info
4. Click on the row to edit
5. Update the fields and save

---

## 7. Annual Election Process

### Before elections:
1. Go to Manage Committee
2. Archive all current members (they appear in Past Committees)

### After elections:
1. Click "+ Add Member"
2. Add each newly elected member with the new year
3. Members appear on the Committee page immediately

---

## Common Questions

### A resident says they cannot login?
- Check their account in Supabase > Table Editor > profiles
- Make sure status = 'approved'
- Make sure they confirmed their email (check auth.users in Supabase)

### How to change someone to committee role?
- Supabase > Table Editor > profiles
- Find their row
- Change role to 'committee'
- Save

### Website not loading?
- Check Supabase project is active (log in to supabase.com)
- Free tier projects pause after 1 week of inactivity
- Click "Restore project" if paused

### How to update committee for new year?
1. Archive all current members
2. Add new members with new year
3. The website automatically shows only active (is_active=true) members
