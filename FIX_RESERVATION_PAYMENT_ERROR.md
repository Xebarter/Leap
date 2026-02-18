# Fix for Reservation Payment Error

## Problem
When trying to reserve a property, you may encounter these errors:

**Error 1 - booking_id constraint:**
```json
{
  "error": "Failed to create transaction record",
  "details": "null value in column \"booking_id\" of relation \"payment_transactions\" violates not-null constraint"
}
```

**Error 2 - payment_method constraint:**
```json
{
  "error": "Failed to create transaction record",
  "details": "new row for relation \"payment_transactions\" violates check constraint \"payment_transactions_payment_method_check\""
}
```

## Root Causes

### Issue 1: booking_id NOT NULL Constraint
The `payment_transactions` table has a NOT NULL constraint on the `booking_id` column. However, when creating a **reservation** (not a booking), there is no `booking_id` yet - only a `reservation_id`.

The system has two different concepts:
- **Reservations** (`property_reservations`) - Initial reservation with deposit payment
- **Bookings** (`bookings`) - Confirmed occupancies/tenancies

### Issue 2: payment_method Constraint
The database constraint only allows specific payment methods:
- `'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card', 'Check', 'Cash', 'E-Wallet', 'Other'`

But the code is trying to insert `'pesapal'` (lowercase), which is not in the allowed list.

## Solution
Run the comprehensive SQL migration that fixes both issues.

### Step 1: Apply the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the COMPLETE migration from: `scripts/FIX_PAYMENT_TRANSACTIONS_COMPLETE.sql`

**Or run this SQL directly:**

```sql
-- Make booking_id nullable (payments can be for reservations OR bookings)
ALTER TABLE public.payment_transactions
ALTER COLUMN booking_id DROP NOT NULL;

-- Make tenant_id nullable (for guest/unauthenticated reservations)
ALTER TABLE public.payment_transactions
ALTER COLUMN tenant_id DROP NOT NULL;

-- Drop the old payment_method check constraint
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

-- Add updated payment_method constraint with modern payment options
ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN (
  'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card',
  'Check', 'Cash', 'E-Wallet', 'Other',
  'pesapal', 'flutterwave', 'airtel', 'mtn', 'mobile_money'
));

-- Add check constraint to ensure at least one reference exists
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS chk_payment_has_reference;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT chk_payment_has_reference 
CHECK (
  booking_id IS NOT NULL OR 
  reservation_id IS NOT NULL OR 
  property_code IS NOT NULL
);

-- Allow service role and system to insert transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.payment_transactions;

CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- Allow admins to manage all transactions
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

6. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
7. Wait for "Success. No rows returned" message

### Step 2: Verify the Fix

After running the migration, verify the changes in the SQL Editor:

```sql
-- Check that columns are now nullable
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
  AND column_name IN ('booking_id', 'reservation_id', 'tenant_id', 'property_code');
```

**Expected result:**
- `booking_id`: is_nullable = **YES** ✅
- `tenant_id`: is_nullable = **YES** ✅
- `reservation_id`: is_nullable = **YES** ✅
- `property_code`: is_nullable = **YES** ✅

**Verify payment_method constraint:**
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payment_transactions'::regclass
  AND conname LIKE '%payment_method%';
```

**Expected:** Should show constraint includes `'pesapal'`, `'airtel'`, `'mtn'`, `'mobile_money'`

### Step 3: Test the Reservation Flow

1. Log out and log back in to your application
2. Go to any property details page
3. Click "Reserve Property"
4. Fill in the reservation form
5. Submit the reservation

The payment transaction should now be created successfully with:
- `reservation_id` populated
- `booking_id` = NULL (will be populated later when reservation converts to booking)
- `property_code` populated

## Technical Details

### Payment Transaction Flow for Reservations

1. **User reserves a property** → Creates record in `property_reservations`
2. **Payment initiated** → Creates record in `payment_transactions` with:
   - `reservation_id` = the reservation ID
   - `booking_id` = NULL (no booking yet)
   - `property_code` = the property/unit code
   - `status` = 'pending' or 'processing'

3. **Payment completed** → Updates `payment_transactions.status` to 'completed'
4. **Reservation confirmed** → Updates `property_reservations.payment_status` to 'paid'
5. **Booking created** (later) → When tenant moves in, a booking is created and `payment_transactions.booking_id` can be updated

### Files Modified

- ✅ `scripts/FIX_PAYMENT_TRANSACTIONS_BOOKING_ID_CONSTRAINT.sql` - Database migration

### Related Files (for reference)

- `app/api/payments/pesapal/initiate/route.ts` - Where payment transaction is created
- `components/publicView/reserve-property-dialog.tsx` - Reservation form
- `lib/payments/payment-service.ts` - Payment service that saves transactions
- `scripts/PAYMENTS_SCHEMA.sql` - Original schema (has the NOT NULL constraint)
- `scripts/ADD_PAYMENT_TRANSACTIONS_UPDATES.sql` - Added reservation_id column

## Verification Checklist

After applying the fix, verify:

- [ ] Database migration applied successfully
- [ ] `booking_id` column is nullable
- [ ] Check constraint exists to ensure at least one reference
- [ ] Can create reservations without errors
- [ ] Payment transactions are created with `reservation_id`
- [ ] Payment flow redirects to Pesapal correctly

## Summary of Changes

The migration fixes **TWO critical issues**:

1. ✅ **booking_id constraint** - Made nullable so reservations can create payment transactions
2. ✅ **payment_method constraint** - Added support for modern payment methods (pesapal, airtel, mtn, etc.)
3. ✅ **tenant_id constraint** - Made nullable for guest reservations
4. ✅ **RLS policies** - Updated to allow system/API insertions
5. ✅ **Check constraint** - Ensures at least one reference (booking_id, reservation_id, or property_code) exists

## Additional Notes

### Why This Happened

The original `PAYMENTS_SCHEMA.sql` was designed for a booking-only system with traditional payment methods. Later features were added:
- Reservation system (added `reservation_id` column)
- Modern payment gateways like Pesapal (code uses `'pesapal'` as payment method)

But the original constraints weren't updated, causing conflicts.

### Future Considerations

When a reservation is converted to a booking:
1. Create the booking record
2. Update the payment transaction: `UPDATE payment_transactions SET booking_id = ? WHERE reservation_id = ?`
3. This maintains the full payment history from reservation to booking

### Files Involved

**Database Migration:**
- `scripts/FIX_PAYMENT_TRANSACTIONS_COMPLETE.sql` ✅ **RUN THIS**

**Code Files (no changes needed):**
- `app/api/payments/pesapal/initiate/route.ts` - Already correctly sends `payment_method: 'pesapal'`
- `components/publicView/reserve-property-dialog.tsx` - Reservation form
- `lib/payments/payment-service.ts` - Payment service
