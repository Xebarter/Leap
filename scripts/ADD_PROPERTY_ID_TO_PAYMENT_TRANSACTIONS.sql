-- ============================================================================
-- ADD PROPERTY_ID COLUMN TO PAYMENT_TRANSACTIONS TABLE
-- ============================================================================
-- This adds the property_id column to link payments directly to properties
-- ============================================================================

-- Add property_id column
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Add months_paid column (used for tracking rental payment duration)
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS months_paid INTEGER DEFAULT 1;

-- Create index on property_id for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_property_id 
ON public.payment_transactions(property_id);

-- Add comment to document the column
COMMENT ON COLUMN public.payment_transactions.property_id IS 
'Direct reference to the property for this payment transaction';

COMMENT ON COLUMN public.payment_transactions.months_paid IS 
'Number of months covered by this payment (for rental payments)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added columns:
-- ✓ property_id - Direct link to properties table
-- ✓ months_paid - Track payment duration
-- ✓ Index for performance optimization
-- ============================================================================
