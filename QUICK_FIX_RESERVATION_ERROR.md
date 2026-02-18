# 🚀 Quick Fix: Reservation Payment Error

## The Error You're Seeing
```json
{
  "error": "Failed to create transaction record",
  "details": "new row for relation \"payment_transactions\" violates check constraint \"payment_transactions_payment_method_check\""
}
```

## The Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run This SQL
Copy and paste this entire block and click **Run**:

```sql
-- Fix 1: Make booking_id nullable
ALTER TABLE public.payment_transactions
ALTER COLUMN booking_id DROP NOT NULL;

-- Fix 2: Make tenant_id nullable  
ALTER TABLE public.payment_transactions
ALTER COLUMN tenant_id DROP NOT NULL;

-- Fix 3: Update payment_method constraint to include modern payment methods
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN (
  'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card',
  'Check', 'Cash', 'E-Wallet', 'Other',
  'pesapal', 'flutterwave', 'airtel', 'mtn', 'mobile_money'
));

-- Fix 4: Add reference check
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS chk_payment_has_reference;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT chk_payment_has_reference 
CHECK (
  booking_id IS NOT NULL OR 
  reservation_id IS NOT NULL OR 
  property_code IS NOT NULL
);

-- Fix 5: Allow system to insert transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.payment_transactions;

CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- Fix 6: Allow admins to manage
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

### Step 3: Verify Success
You should see: **"Success. No rows returned"**

### Step 4: Test It
1. Go to your app
2. Try to reserve a property
3. Fill in the reservation form
4. Submit - it should now work! ✅

## What This Fixed

✅ **booking_id issue** - Reservations don't have bookings yet  
✅ **payment_method issue** - Database now accepts 'pesapal', 'airtel', 'mtn', etc.  
✅ **tenant_id issue** - Allows guest reservations  
✅ **RLS policies** - System can now insert payment records  

## Still Having Issues?

Check the full documentation: `FIX_RESERVATION_PAYMENT_ERROR.md`

## Need to Rollback?

If something goes wrong, you can make the columns NOT NULL again:
```sql
-- ROLLBACK (only if needed)
ALTER TABLE public.payment_transactions
ALTER COLUMN booking_id SET NOT NULL;

ALTER TABLE public.payment_transactions
ALTER COLUMN tenant_id SET NOT NULL;
```

**Note:** Only rollback if you have no reservation data. Otherwise, it will fail because existing reservations have NULL booking_id values.
