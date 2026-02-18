# Fix: Schedule Visit Loading Spinner Issue

## Problem
When clicking "Schedule Visit", a loading spinner appears and keeps spinning indefinitely. Nothing happens because the database insert fails.

## Root Cause
The `bookings` table has `tenant_id` as `NOT NULL`, but visit bookings can be created by non-authenticated users (potential tenants who don't have accounts yet). This causes the insert to fail silently.

## Solution

### Step 1: Run the SQL Migration
Execute the following SQL script in your Supabase SQL Editor:

**File:** `scripts/FIX_VISIT_BOOKING_TENANT_ID.sql`

```sql
-- Make tenant_id nullable for visit bookings
ALTER TABLE public.bookings 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the constraint to ensure tenant_id is provided for rental bookings
-- but optional for visit bookings
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS booking_type_fields_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_fields_check 
CHECK (
  (booking_type = 'rental' AND tenant_id IS NOT NULL AND check_in IS NOT NULL AND check_out IS NOT NULL AND total_price_ugx IS NOT NULL) OR
  (booking_type = 'visit' AND visit_date IS NOT NULL AND visit_time IS NOT NULL AND visitor_name IS NOT NULL)
);
```

### Step 2: Code Changes Made
The following changes have been applied to `components/publicView/schedule-visit-dialog.tsx`:

1. **Made tenant_id optional in booking data** - Only includes `tenant_id` if user is authenticated
2. **Removed authentication requirement** - Users can now schedule visits without signing in

### Step 3: Test the Fix
1. Go to any property details page
2. Click "Schedule Visit"
3. Fill in the form with your details
4. Click "Schedule Visit"
5. You should see a success message and the visit should be created

## What Changed

### Database Schema
- `tenant_id` is now nullable in the `bookings` table
- Constraint ensures `tenant_id` is still required for rental bookings
- Visit bookings can be created without a `tenant_id`

### Component Logic
- Removed the authentication check that was blocking form submission
- Made `tenant_id` conditionally included in the booking data (only if user is authenticated)
- Visit bookings now work for both authenticated and non-authenticated users

## Testing Checklist
- [ ] Run the SQL migration in Supabase
- [ ] Test scheduling a visit without being logged in
- [ ] Test scheduling a visit while logged in
- [ ] Verify visit appears in admin bookings dashboard
- [ ] Check that the loading spinner disappears after submission

## Quick Fix Command
```bash
# Copy the SQL file content and run it in Supabase SQL Editor
cat scripts/FIX_VISIT_BOOKING_TENANT_ID.sql
```

---
**Status:** Ready to deploy
**Priority:** High (blocking feature)
**Impact:** Fixes critical bug preventing users from scheduling property visits
