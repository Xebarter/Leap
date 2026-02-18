-- ============================================================================
-- FIX PAYMENT TRANSACTIONS BOOKING_ID CONSTRAINT
-- ============================================================================
-- This migration removes the NOT NULL constraint from booking_id column
-- to allow payment transactions for reservations (which don't have a booking_id yet)
-- ============================================================================

-- Make booking_id nullable since payments can be for reservations OR bookings
ALTER TABLE public.payment_transactions
ALTER COLUMN booking_id DROP NOT NULL;

-- Add a check constraint to ensure either booking_id OR reservation_id is present
-- (but not necessarily both, as a reservation payment can later become a booking)
ALTER TABLE public.payment_transactions
DROP CONSTRAINT IF EXISTS chk_payment_has_reference;

ALTER TABLE public.payment_transactions
ADD CONSTRAINT chk_payment_has_reference 
CHECK (
  booking_id IS NOT NULL OR 
  reservation_id IS NOT NULL OR 
  property_code IS NOT NULL
);

-- Update RLS policies to handle both reservation and booking payments
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.payment_transactions;

-- Allow service role to insert transactions (used by payment APIs)
CREATE POLICY "Service role can insert transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- Allow admins to insert transactions
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add comment explaining the change
COMMENT ON COLUMN public.payment_transactions.booking_id IS 
'Reference to booking (occupancy). NULL for reservation payments that have not yet been converted to bookings.';

COMMENT ON COLUMN public.payment_transactions.reservation_id IS 
'Reference to property reservation. Used for reservation deposit payments.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Changes:
-- ✓ booking_id is now nullable
-- ✓ Added check constraint to ensure at least one reference exists
-- ✓ Updated RLS policies for payment insertion
-- ✓ Added documentation comments
-- 
-- This allows payment transactions to be created for:
-- 1. Reservations (reservation_id set, booking_id NULL initially)
-- 2. Bookings (booking_id set, reservation_id may or may not be set)
-- 3. Direct property payments (property_code set)
-- ============================================================================
