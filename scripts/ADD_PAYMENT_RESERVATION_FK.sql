-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT FOR RESERVATION_ID
-- ============================================================================
-- Run this AFTER creating the reservations table
-- This adds the foreign key constraint between payment_transactions and reservations
-- ============================================================================

-- Add foreign key constraint for reservation_id (only if it doesn't exist)
-- This ensures data integrity between payments and reservations

-- First, drop the constraint if it exists (to allow re-running this script)
ALTER TABLE public.payment_transactions 
DROP CONSTRAINT IF EXISTS fk_payment_transactions_reservation_id;

-- Now add the constraint
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT fk_payment_transactions_reservation_id 
FOREIGN KEY (reservation_id) 
REFERENCES public.property_reservations(id) 
ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✓ Foreign key constraint added for reservation_id
-- ============================================================================
