-- ============================================================================
-- ADD MISSING COLUMNS TO PAYMENT_TRANSACTIONS TABLE
-- ============================================================================
-- This migration adds columns needed for Pesapal and other payment integrations
-- ============================================================================

-- Add email column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add phone_number column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add property_code column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS property_code TEXT;

-- Add reservation_id column (without foreign key constraint for now)
-- Note: The foreign key constraint will be added after the reservations table is created
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS reservation_id UUID;

-- Create index on reservation_id for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reservation_id 
ON public.payment_transactions(reservation_id);

-- Create index on property_code for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_property_code 
ON public.payment_transactions(property_code);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added columns:
-- ✓ email - Customer email address
-- ✓ phone_number - Customer phone number
-- ✓ property_code - Property reference code
-- ✓ reservation_id - Link to reservations table
-- ✓ Indexes for performance optimization
-- ============================================================================
