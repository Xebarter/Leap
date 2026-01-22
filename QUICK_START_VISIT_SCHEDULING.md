# Quick Start: Visit Scheduling Feature

## 🚀 Setup (3 Steps)

### Step 1: Run Database Migration
Open your Supabase SQL Editor and run:
```sql
-- File: scripts/ADD_VISIT_BOOKING_SUPPORT.sql
```
This adds visit scheduling support to the bookings table.

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test the Feature
Navigate to any property details page and click "Schedule a Visit"

## 📍 Where to Find Everything

### For Users (Public)
- **Browse Properties:** `/properties`
- **Property Details:** `/properties/[id]`
- **Schedule Visit Button:** On any property details page (right sidebar)

### For Tenants (Logged In)
- **My Visits:** `/tenant/visits`
- **Dashboard:** `/tenant` (shows recent activity)
- **Sidebar Link:** "My Visits" under Rental section

### For Admins
- **View All Visits:** `/admin/bookings`
- **Filter Visits:** Use the "Site Visits" tab
- **Manage Visits:** Confirm, cancel, or view details from dropdown

## 🎯 Test Scenarios

### Scenario 1: Anonymous User Books a Visit
1. Go to `http://localhost:3001/properties`
2. Click on any property
3. Click "Schedule a Visit" button
4. Fill in: Name, Email, Phone, Date, Time
5. Submit form
6. ✅ Success toast appears
7. Visit is recorded in admin bookings

### Scenario 2: Logged-In User Books a Visit
1. Sign in at `/auth/login`
2. Browse to any property
3. Click "Schedule a Visit"
4. Form auto-fills with your info
5. Select date/time
6. Submit
7. ✅ Redirected to tenant dashboard
8. Check `/tenant/visits` to see your booking

### Scenario 3: Admin Reviews Visits
1. Sign in as admin
2. Go to `/admin/bookings`
3. Click "Site Visits" tab to filter
4. See all scheduled visits with:
   - Visitor name and contact info
   - Property details
   - Visit date/time
   - Status badge (Scheduled/Today/Completed)
5. Use dropdown to confirm or cancel visits

## 🎨 UX Features

| Feature | Description |
|---------|-------------|
| **Smart Forms** | Auto-fills user info if logged in |
| **Date Protection** | Can't book in the past |
| **Business Hours** | Time picker: 8 AM - 6 PM only |
| **Phone Validation** | Ensures valid phone format |
| **Visual Status** | Color-coded badges (blue=today, yellow=scheduled, gray=past) |
| **Type Badges** | Clear "Visit" vs "Rental" labels |
| **Contact Display** | Quick access to visitor email/phone |
| **Empty States** | Helpful CTAs when no visits exist |
| **Toast Feedback** | Immediate success/error messages |
| **Responsive** | Works on mobile and desktop |

## 📊 Data Flow

```
User Action → Dialog Form → Supabase (bookings table)
                                ↓
                    ┌───────────┴───────────┐
                    ↓                       ↓
            Admin Bookings Page      Tenant Visits Page
            (All visits)             (User's visits only)
```

## 🔒 Security (RLS Policies)

- ✅ **Anyone** can create visit bookings (no login required)
- ✅ **Users** can view their own visits (by tenant_id or email)
- ✅ **Admins** can view/manage all bookings
- ✅ **Properties** join works for public property data

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Schedule a Visit" button doesn't work | Check browser console for errors |
| Dialog doesn't open | Verify Dialog component is imported correctly |
| Visit doesn't appear in admin | Check if migration ran successfully |
| Can't see visits in tenant page | Verify user email matches visitor_email |
| Phone validation fails | Use format: +256 700 000 000 or similar |

## 📱 Pages Overview

### Files Created
```
components/publicView/schedule-visit-dialog.tsx  ← Main dialog component
app/(dashboard)/tenant/visits/page.tsx           ← Tenant visits page
scripts/ADD_VISIT_BOOKING_SUPPORT.sql           ← Database migration
```

### Files Modified
```
app/(public)/properties/[id]/property-details-content.tsx  ← Added dialog button
components/adminView/comprehensive-booking-manager.tsx     ← Updated for visits
components/tenantView/tenant-sidebar.tsx                   ← Added "My Visits" link
```

## ✨ Key Components

### ScheduleVisitDialog
**Props:**
- `propertyId` - Property to visit
- `propertyTitle` - Display in dialog
- `propertyLocation` - Display in dialog
- `triggerButton` - Custom button (optional)

**Usage:**
```tsx
<ScheduleVisitDialog 
  propertyId="property-uuid"
  propertyTitle="Luxury Apartment"
  propertyLocation="Kampala, Uganda"
/>
```

## 🎯 Next Steps

After testing:
1. ✅ Verify migration ran successfully
2. ✅ Test anonymous booking flow
3. ✅ Test logged-in user flow
4. ✅ Check admin can see visits
5. ✅ Verify tenant can see their visits
6. ✅ Test filtering in admin panel
7. ✅ Test confirm/cancel actions

## 📞 Contact Fields

Visit bookings store:
- `visitor_name` - Full name
- `visitor_email` - Email address
- `visitor_phone` - Phone number
- `visit_date` - Scheduled date
- `visit_time` - Scheduled time
- `visit_notes` - Optional questions/notes
- `booking_type` - Always "visit"
- `status` - pending/confirmed/cancelled/completed

## 🌟 Production Ready

This implementation is production-ready with:
- ✅ Proper error handling
- ✅ Loading states
- ✅ Form validation
- ✅ Security (RLS)
- ✅ Responsive design
- ✅ Accessibility
- ✅ TypeScript support
- ✅ Toast notifications
- ✅ Clean UI/UX

---

**Status:** ✅ Complete and ready to use!
**Version:** 1.0
**Date:** January 2026
