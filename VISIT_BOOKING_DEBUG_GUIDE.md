# Visit Booking Loading Spinner - Debug & Fix Guide

## Issue
The "Schedule Visit" button shows a loading spinner that never stops. The booking is not being created.

## Root Causes Identified

1. **Database Schema Issue**: `tenant_id` was NOT NULL but visit bookings can be anonymous
2. **RLS Policy Issue**: Anonymous users (`anon` role) don't have INSERT permission on bookings table
3. **Missing Constraint**: The booking type constraint needs updating

## Complete Fix - Run This SQL

**IMPORTANT**: Run this complete SQL script in your Supabase SQL Editor:

```sql
-- Step 1: Make tenant_id nullable
ALTER TABLE public.bookings 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 2: Drop old constraint if exists
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS booking_type_fields_check;

-- Step 3: Add updated constraint
ALTER TABLE public.bookings 
ADD CONSTRAINT booking_type_fields_check 
CHECK (
  (booking_type = 'rental' AND tenant_id IS NOT NULL AND check_in IS NOT NULL AND check_out IS NOT NULL AND total_price_ugx IS NOT NULL) OR
  (booking_type = 'visit' AND visit_date IS NOT NULL AND visit_time IS NOT NULL AND visitor_name IS NOT NULL)
);

-- Step 4: Drop existing visit booking policies to recreate them
DROP POLICY IF EXISTS "Anyone can create visit bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their visit bookings by email" ON public.bookings;
DROP POLICY IF EXISTS "Tenants can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;

-- Step 5: Create policy for ANONYMOUS users to create visit bookings
CREATE POLICY "Anyone can create visit bookings" ON public.bookings
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (booking_type = 'visit');

-- Step 6: Create policy for authenticated users to create any bookings
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id OR booking_type = 'visit');

-- Step 7: Create policy to view own bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT 
  TO authenticated, anon
  USING (
    auth.uid() = tenant_id OR 
    (booking_type = 'visit' AND visitor_email = auth.jwt()->>'email')
  );

-- Step 8: Grant necessary permissions to ANON role
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT ON public.bookings TO anon;

-- Step 9: Verify RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

## How to Debug

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to schedule a visit
4. Look for the console logs with emojis:
   - 🔍 = Booking data being sent
   - 📊 = Database response
   - ❌ = Error details
   - ✅ = Success

### Step 2: Check What Error You're Getting

Look for these specific error messages:

**Error: "new row violates row-level security policy"**
- **Cause**: RLS policies don't allow anonymous inserts
- **Fix**: The SQL script above fixes this by granting permissions to `anon` role

**Error: "null value in column 'tenant_id' violates not-null constraint"**
- **Cause**: `tenant_id` is required but shouldn't be for visits
- **Fix**: The SQL script makes `tenant_id` nullable

**Error: "new row for relation 'bookings' violates check constraint"**
- **Cause**: The constraint doesn't account for visit bookings properly
- **Fix**: The SQL script updates the constraint

### Step 3: Verify the Fix

After running the SQL, check the console logs:
1. You should see `🔍 Attempting to insert booking data:` with your data
2. Then `✅ Visit scheduled successfully:` with the created booking
3. A success toast message should appear

## Code Changes Made

The following files have been updated:

### `components/publicView/schedule-visit-dialog.tsx`
- ✅ Made `tenant_id` optional in booking data
- ✅ Removed authentication requirement for scheduling visits
- ✅ Added detailed console logging for debugging

## Testing Steps

1. **Run the SQL migration** in Supabase SQL Editor
2. **Clear your browser cache** (Ctrl+Shift+Delete)
3. **Refresh the page**
4. **Open browser console** (F12)
5. **Click "Schedule Visit"** on any property
6. **Fill in the form** with valid data
7. **Click "Schedule Visit"** button
8. **Check console** for detailed logs
9. **Verify** you see success message

## If It Still Doesn't Work

Run this diagnostic SQL to check your setup:

```sql
-- Check if tenant_id is nullable
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'tenant_id';
-- Should return: is_nullable = 'YES'

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;
-- Should show policies for 'anon' role

-- Check permissions
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'bookings' AND grantee = 'anon';
-- Should show INSERT and SELECT
```

## What to Share If Still Broken

If the issue persists, please share:

1. **Console error logs** (copy the red error messages)
2. **The booking data being sent** (from the 🔍 log)
3. **Results of the diagnostic SQL** above
4. **Screenshot of the browser console** when you click "Schedule Visit"

---

**Files to Use:**
- SQL Fix: `scripts/FIX_VISIT_BOOKING_COMPLETE.sql`
- Diagnostic: `scripts/CHECK_VISIT_BOOKING_POLICIES.sql`
