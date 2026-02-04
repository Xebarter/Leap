-- =====================================================
-- FIX RESERVATION CANCELLATION POLICY
-- =====================================================
-- Allow tenants to cancel reservations only if payment is still pending
-- =====================================================

-- Drop the old policy that only allows updating pending reservations
DROP POLICY IF EXISTS "Tenants can update own pending reservations" ON property_reservations;
DROP POLICY IF EXISTS "Tenants can cancel own reservations" ON property_reservations;

-- Create new policy that allows cancelling only if payment is pending or failed
CREATE POLICY "Tenants can cancel own unpaid reservations"
  ON property_reservations
  FOR UPDATE
  USING (
    auth.uid() = tenant_id 
    AND (status = 'pending' OR status = 'confirmed')
    AND (payment_status = 'pending' OR payment_status = 'failed')
  )
  WITH CHECK (
    auth.uid() = tenant_id 
    AND (status IN ('pending', 'confirmed', 'cancelled'))
    AND (payment_status IN ('pending', 'failed', 'paid', 'refunded'))
  );

-- Note: This policy allows tenants to:
-- 1. Update their own reservations that are pending or confirmed
-- 2. ONLY if payment status is 'pending' or 'failed' (cannot cancel paid reservations)
-- 3. Change the status to cancelled (or keep it as pending/confirmed)
-- 4. Paid reservations require admin intervention for refunds
