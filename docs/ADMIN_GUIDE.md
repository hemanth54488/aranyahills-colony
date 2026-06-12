# Admin Guide

## For the Secretary / Technical Admin

This guide explains how to manage the Aranya Hills Colony website. No coding knowledge required.

---

## Logging In

1. Go to https://aranyahillscolony.in/login
2. Enter your email and password
3. You will see a welcome animation, then the home page
4. Click your name in the top-right → **Admin Panel**
5. Or go directly to: https://aranyahillscolony.in/admin

---

## Admin Dashboard

The dashboard shows live counts:
- Pending registrations (orange alert if any)
- Open complaints and pending bookings
- Total committee members and plots

Three sections link to all admin functions: **Resident Management**, **Colony Operations**, **Community**.

---

## 1. Approving New Registrations

When a resident registers, you will see an orange alert on the Dashboard.

1. Click "Pending Registrations"
2. Review name, plot number, phone for each person
3. Click **Approve** to grant access — they get an email
4. Click **Reject** to deny — they can register again

> Only approve residents you recognise from Aranya Hills Colony.

---

## 2. Managing Committee Members

### Add a New Member
1. Admin Panel → **Manage Committee** → **+ Add Member**
2. Fill in: Full Name *(required)*, Role, Year, Phone, Email *(optional)*
3. **Upload Photo** — click the button, pick a photo from your computer (JPG/PNG, max 5 MB)
4. Click **Add Member**

### Update a Member's Photo
1. Admin Panel → **Manage Committee**
2. Click the **📷 Photo** button next to any member
3. Click **Choose New Photo**, pick from your computer
4. The photo saves immediately

### Archive Old Committee (After Elections)
1. Admin Panel → **Manage Committee**
2. Click **Archive** next to each outgoing member
3. They move to the "Past / Archived" tab
4. Add new members with the new year

---

## 3. Managing Plots

1. Admin Panel → **Manage Plots**
2. Click **Edit** next to any plot
3. Update: Status, Area (Sq. Yards), Address, GPS coordinates, House photo URL
4. Click **Save Changes**

**Getting GPS coordinates from Google Maps:**
1. Open maps.google.com → find the plot location
2. Right-click → first line shows coordinates (e.g. 17.3265, 78.5312)
3. First number = Latitude, Second = Longitude

---

## 4. Posting Notices

1. Admin Panel → **Manage Notices** → **Post Notice**
2. Fill in:
   - **Priority**: General / Urgent / Event
   - **Pin**: Pins the notice to the top
   - **English title & content** *(required)*
   - Telugu and Hindi translations *(optional)*
   - **Expires On**: Auto-hides the notice on this date
3. Click **Save**

Pinned urgent notices appear highlighted in red at the top of the Notices page.

---

## 5. Maintenance Fee Management

### Create Invoices
1. Admin Panel → **Maintenance** → **Create Invoice**
2. Toggle **Bulk Create for All Plots** to generate for all occupied plots at once
   — or select a specific plot
3. Enter: Period (e.g. "2026-Q1"), Amount (₹), Due Date
4. Click **Save**

### Verify Payments
When a resident marks a payment, it appears in the **Pending Verification** section:
1. Review the transaction reference and date
2. Click **Mark as Verified** to confirm

---

## 6. Managing Complaints

1. Admin Panel → **Complaints**
2. Click **Update** next to any complaint
3. Change the **Status**: Open → Assigned → In Progress → Resolved → Closed
4. **Assign To** a committee member if needed
5. Add an **Update Note** visible to the resident
6. For resolved/closed complaints, add a **Resolution Note**

The resident sees the status update immediately and can rate the resolution (1–5 stars).

---

## 7. Facility Bookings

When a resident requests a booking, it appears as **Pending**:

1. Admin Panel → **Facility Bookings**
2. Review the request (facility, date, time, purpose, attendees)
3. Click **Approve** to confirm the booking
4. Click **Reject** and enter a reason if unavailable

---

## 8. Managing Events

1. Admin Panel → **Events** → **Add Event**
2. Fill in: Title, Date, Start/End Time, Location, Description, Image URL
3. Click **Save** — appears on the public Events page immediately

---

## 9. Managing Polls

### Create a Poll
1. Admin Panel → **Polls** → **Create Poll**
2. Enter the question, options (min 2, max 6), end date
3. Choose when to **Show Results**: Always / After voting / After poll closes
4. Click **Save** — residents can vote immediately

### Close a Poll Early
Click **Close Poll** next to any active poll. Results become visible to all.

---

## 10. Managing Documents

### Upload a Document
1. Admin Panel → **Documents** → **Add Document**
2. Enter a document name and select a category
3. **Upload from device** — click the upload area, pick a PDF/image (max 5 MB)
   — OR paste a Google Drive / external link
4. Toggle **Visible to public** if non-members should see it
5. Click **Add Document**

### Toggle Public/Private
Click the **Public** or **Private** button next to any document to switch its visibility.

### Delete
Click the red trash icon next to any document.

---

## 11. Security Role Management

To give gate security access to the Security Dashboard:

1. Go to Supabase Dashboard → Table Editor → **profiles**
2. Find the security staff member's row
3. Change `role` to `security` and `status` to `approved`
4. They can now access https://aranyahillscolony.in/security

The Security Dashboard lets security staff:
- Enter an 8-character gate pass code to verify a visitor
- Log entry and exit times

---

## 12. Audit Logs

Admin Panel → **Audit Logs** shows a searchable record of all admin actions (approvals, deletions, status changes).

---

## Annual Election Process

### Before elections:
1. Go to Manage Committee
2. Click **Archive** for each current member

### After elections:
1. Click **+ Add Member** for each newly elected person
2. Set the Year to the new year
3. Upload their photos

---

## Common Questions

### A resident cannot login?
- Supabase → Table Editor → **profiles** → find row → check `status = 'approved'`
- Also check they confirmed their email (Supabase → Authentication → Users)

### How to assign committee role to a resident?
- Supabase → Table Editor → **profiles** → find row → change `role` to `'committee'`

### Website not loading?
- Supabase free tier pauses after 1 week of inactivity
- Log in to supabase.com → click **Restore project**

### How to update bank details?
- Supabase → Table Editor → **colony_info** → click the row → update fields → Save

### A committee member's photo looks wrong?
- Admin Panel → Manage Committee → click **📷 Photo** → upload a new photo

### Storage is full?
- Supabase Storage free tier = 1 GB
- Delete old/unused photos from Supabase → Storage → colony-files
