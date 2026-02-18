-- ============================================================================
-- COMPLETE FIX FOR PAYMENT TRANSACTIONS TABLE
-- ============================================================================
-- This migration fixes all issues with payment transactions for reservations:
-- 1. Makes booking_id nullable (for reservation payments)
-- 2. Updates payment_method constraint to include modern payment methods
-- 3. Makes tenant_id nullable (for guest reservations)
-- 4. Adds proper RLS policies
-- ============================================================================

-- Step 1: Make booking_id nullable (payments can be for reservations OR bookings)
ALTER TABLE public.payment_transactions
ALTER COLUMN booking_id DROP NOT NULL;

-- Step 2: Make tenant_id nullable (for guest/unauthenticated reservations)
ALTER TABLE public.payment_transactions
ALTER COLUMN tenant_id DROP NOT NULL;

-- Step 3: Drop the old payment_method check constraint
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS payment_transactions_payment_method_check;

-- Step 4: Add updated payment_method constraint with modern payment options
ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_payment_method_check 
CHECK (payment_method IN (
  'Bank Transfer', 'Mobile Money', 'Credit Card', 'Debit Card',
  'Check', 'Cash', 'E-Wallet', 'Other',
  'pesapal', 'flutterwave', 'airtel', 'mtn', 'mobile_money'
));

-- Step 5: Add check constraint to ensure at least one reference exists
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS chk_payment_has_reference;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT chk_payment_has_reference 
CHECK (
  booking_id IS NOT NULL OR 
  reservation_id IS NOT NULL OR 
  property_code IS NOT NULL
);

-- Step 6: Update RLS policies

-- Drop old policies that might conflict
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.payment_transactions;

-- Allow service role and system to insert transactions (used by payment APIs)
CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- Allow admins to manage all transactions
CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update existing policy to handle NULL tenant_id
DROP POLICY IF EXISTS "Tenants can view their own transactions" ON public.payment_transactions;

CREATE POLICY "Tenants can view their own transactions" ON public.payment_transactions
  FOR SELECT USING (
    auth.uid() = tenant_id OR
    tenant_id IS NULL  -- Allow viewing guest transactions
  );

-- Step 7: Add helpful comments
COMMENT ON COLUMN public.payment_transactions.booking_id IS 
'Reference to booking (occupancy). NULL for reservation payments that have not yet been converted to bookings.';

COMMENT ON COLUMN public.payment_transactions.reservation_id IS 
'Reference to property reservation. Used for reservation deposit payments.';

COMMENT ON COLUMN public.payment_transactions.tenant_id IS 
'Reference to tenant/user. NULL for guest reservations (unauthenticated users).';

COMMENT ON COLUMN public.payment_transactions.payment_method IS 
'Payment method used. Can be traditional (Cash, Bank Transfer) or modern (pesapal, mobile_money, airtel, mtn).';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify booking_id is nullable
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
  AND column_name IN ('booking_id', 'reservation_id', 'tenant_id', 'property_code');

-- Verify payment_method constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payment_transactions'::regclass
  AND conname LIKE '%payment_method%';

-- Verify check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.payment_transactions'::regclass
  AND contype = 'c';  -- c = check constraint

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Changes applied:
-- ✓ booking_id is now nullable
-- ✓ tenant_id is now nullable (for guest reservations)
-- ✓ payment_method constraint updated to include: pesapal, flutterwave, airtel, mtn, mobile_money
-- ✓ Added check constraint to ensure at least one reference exists
-- ✓ Updated RLS policies for flexible payment insertion
-- ✓ Added documentation comments
-- 
-- This allows payment transactions for:
-- 1. Authenticated user reservations (tenant_id set, reservation_id set)
-- 2. Guest reservations (tenant_id NULL, reservation_id set)
-- 3. Bookings (booking_id set)
-- 4. Any payment with property_code
-- ============================================================================
