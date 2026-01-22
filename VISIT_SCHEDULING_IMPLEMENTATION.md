# Property Visit Scheduling - Implementation Guide

## Overview
A complete UX-optimized flow for scheduling property visits that integrates with the admin bookings page and tenant dashboard.

## Features Implemented

### 1. **Schedule Visit Dialog** (`components/publicView/schedule-visit-dialog.tsx`)
- ✅ User-friendly modal dialog for scheduling visits
- ✅ Auto-populates user info if logged in
- ✅ Allows anonymous users to schedule visits
- ✅ Phone number validation
- ✅ Date/time picker with business hours (8 AM - 6 PM)
- ✅ Optional notes field for visitor questions
- ✅ Toast notifications for success/error states
- ✅ Auto-redirect to tenant dashboard after successful booking

### 2. **Property Details Integration**
- ✅ "Schedule a Visit" button on property details page
- ✅ Opens dialog with property context pre-filled
- ✅ Located in: `app/(public)/properties/[id]/property-details-content.tsx`

### 3. **Database Schema** (`scripts/ADD_VISIT_BOOKING_SUPPORT.sql`)
Extended the `bookings` table with:
- `booking_type` - Distinguishes between 'visit' and 'rental'
- `visit_date` - Scheduled visit date
- `visit_time` - Scheduled visit time
- `visitor_name` - Name of visitor (may differ from tenant)
- `visitor_phone` - Contact phone
- `visitor_email` - Contact email
- `visit_notes` - Additional visitor notes/questions

**Key Features:**
- ✅ RLS policies allow anonymous visit bookings
- ✅ Constraints ensure required fields based on booking type
- ✅ Indexes for optimal query performance
- ✅ Made check_in, check_out, and total_price nullable for visits

### 4. **Admin Bookings Management** (`components/adminView/comprehensive-booking-manager.tsx`)
- ✅ Updated table to show both visits and rentals
- ✅ Filter tabs: All / Site Visits / Rentals
- ✅ Type badge (Visit/Rental) for easy identification
- ✅ Displays visitor info for visit bookings
- ✅ Shows appropriate date/time based on booking type
- ✅ Contact information column for quick access
- ✅ Status badges with visual indicators:
  - Today (blue) - Visit scheduled for today
  - Scheduled (yellow) - Upcoming visit
  - Completed (gray) - Past visit
  - Pending/Confirmed/Cancelled - Standard statuses
- ✅ Context-aware actions (Confirm Visit vs Confirm Booking)

### 5. **Tenant Visits Page** (`app/(dashboard)/tenant/visits/page.tsx`)
- ✅ Dedicated page for viewing scheduled visits
- ✅ Separated into "Upcoming Visits" and "Past Visits"
- ✅ Property thumbnail and details
- ✅ Visit date, time, and status
- ✅ Contact information display
- ✅ Visitor notes shown
- ✅ Quick actions: View Property, Cancel Visit
- ✅ Empty state with CTA to browse properties

### 6. **Tenant Sidebar Update**
- ✅ Added "My Visits" link under Rental section
- ✅ Easy navigation to visit history

## User Flows

### Flow 1: Guest User Scheduling a Visit
1. User browses properties (no login required)
2. Clicks "Schedule a Visit" on property details page
3. Fills in contact details (name, email, phone)
4. Selects preferred visit date and time
5. Optionally adds notes/questions
6. Submits the form
7. Receives confirmation toast
8. Visit recorded in admin bookings

### Flow 2: Logged-In User Scheduling a Visit
1. User views property details while logged in
2. Clicks "Schedule a Visit"
3. Form auto-populates with user info
4. Selects date/time and adds notes
5. Submits the form
6. Redirected to tenant dashboard
7. Can view visit in "My Visits" page

### Flow 3: Admin Managing Visits
1. Admin navigates to `/admin/bookings`
2. Sees all bookings (visits and rentals)
3. Can filter by type using tabs
4. Views visitor contact information
5. Can confirm, cancel, or view details
6. Status updates automatically based on date

## Database Migration

Run the SQL migration to add visit support:

```sql
-- Location: scripts/ADD_VISIT_BOOKING_SUPPORT.sql
-- Run this in your Supabase SQL Editor
```

**Important:** This migration:
- Adds new columns without breaking existing data
- Makes some fields nullable (check_in, check_out, total_price_ugx)
- Adds constraints to validate data based on booking_type
- Creates indexes for performance
- Sets up RLS policies for anonymous access

## Components Created

### New Files
1. `components/publicView/schedule-visit-dialog.tsx` - Visit scheduling dialog
2. `app/(dashboard)/tenant/visits/page.tsx` - Tenant visits page
3. `scripts/ADD_VISIT_BOOKING_SUPPORT.sql` - Database migration

### Modified Files
1. `app/(public)/properties/[id]/property-details-content.tsx` - Added dialog integration
2. `components/adminView/comprehensive-booking-manager.tsx` - Updated for visits
3. `components/tenantView/tenant-sidebar.tsx` - Added visits link

## Testing Checklist

- [ ] Run database migration in Supabase
- [ ] Test anonymous user scheduling a visit
- [ ] Test logged-in user scheduling a visit
- [ ] Verify visit appears in admin bookings
- [ ] Verify visit appears in tenant's "My Visits" page
- [ ] Test filtering visits vs rentals in admin
- [ ] Test confirming/cancelling visits
- [ ] Verify status badges update correctly
- [ ] Test phone number validation
- [ ] Test date/time restrictions (minimum tomorrow, business hours)

## API Endpoints

No custom API endpoints needed - the implementation uses Supabase direct client queries with RLS policies.

## Security Considerations

- ✅ RLS policies allow anyone to create visit bookings
- ✅ Users can only view their own visits (by tenant_id or email)
- ✅ Admins can view/manage all bookings
- ✅ Anonymous visit bookings use placeholder tenant_id
- ✅ Email matching allows logged-in users to see visits booked before registration

## UX Optimizations

1. **Smart Form Pre-filling** - Auto-fills user info if logged in
2. **Contextual Labeling** - Dialog shows property name and location
3. **Date Restrictions** - Can't book in the past, minimum tomorrow
4. **Business Hours** - Time picker restricted to 8 AM - 6 PM
5. **Visual Status Indicators** - Color-coded badges for quick scanning
6. **Type Badges** - Clear distinction between visits and rentals
7. **Responsive Design** - Works on mobile and desktop
8. **Toast Notifications** - Immediate feedback on actions
9. **Empty States** - Helpful CTAs when no visits scheduled
10. **Quick Actions** - One-click confirm/cancel from admin panel

## Future Enhancements

- [ ] Email notifications to visitors and admins
- [ ] SMS reminders for upcoming visits
- [ ] Calendar integration (Google Calendar, iCal)
- [ ] Visit rescheduling capability
- [ ] Agent assignment for property tours
- [ ] Visit feedback/rating system
- [ ] Conflict detection (prevent double-booking time slots)
- [ ] Automated status updates (mark as completed after visit date)

## Support

For issues or questions:
1. Check the database migration ran successfully
2. Verify RLS policies are active
3. Check browser console for errors
4. Ensure Supabase client is properly configured

---

**Implementation Date:** January 2026
**Status:** ✅ Complete and ready for testing
