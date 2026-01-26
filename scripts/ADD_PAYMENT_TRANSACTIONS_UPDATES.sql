-- ============================================================================
-- UPDATE PAYMENT TRANSACTIONS TABLE FOR MOBILE MONEY INTEGRATION
-- ============================================================================
-- Add support for mobile money payments with 10-digit property code reference

-- Add property_code column to payment_transactions
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS property_code VARCHAR(10);

-- Add reservation_id column to link with property reservations
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.property_reservations(id) ON DELETE SET NULL;

-- Add phone_number column to store customer phone
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add email column to store customer email
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_property_code 
ON public.payment_transactions(property_code);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reservation_id 
ON public.payment_transactions(reservation_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_phone_number 
ON public.payment_transactions(phone_number);

-- Add comments for documentation
COMMENT ON COLUMN public.payment_transactions.property_code IS 
'10-digit unique property/unit identifier for payment reference';

COMMENT ON COLUMN public.payment_transactions.reservation_id IS 
'Reference to property reservation if payment is for a reservation';

COMMENT ON COLUMN public.payment_transactions.phone_number IS 
'Customer phone number used for mobile money payment';

-- Update RLS policies to allow reading by property_code
CREATE POLICY "Users can view transactions by property code" ON public.payment_transactions
  FOR SELECT USING (true); -- Make public for property code lookups

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_transactions'
  AND column_name IN ('property_code', 'reservation_id', 'phone_number', 'email')
ORDER BY ordinal_position;
