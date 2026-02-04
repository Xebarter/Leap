-- ============================================================================
-- PROPERTY OCCUPANCY AND PAYMENT PERIOD TRACKING
-- ============================================================================
-- This migration adds fields to track when properties are paid for and 
-- should be hidden from listings. Properties will automatically reappear 
-- when the payment period expires.
-- ============================================================================

-- ============================================================================
-- 1. ADD OCCUPANCY FIELDS TO PROPERTIES TABLE
-- ============================================================================

-- Add fields to track property occupancy status
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS occupied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS occupancy_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS occupancy_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_extend_occupancy BOOLEAN DEFAULT TRUE;

-- Add comment to explain the fields
COMMENT ON COLUMN public.properties.is_occupied IS 'Whether the property is currently occupied/paid for';
COMMENT ON COLUMN public.properties.occupied_by IS 'User ID of the person who paid for the property';
COMMENT ON COLUMN public.properties.occupancy_start_date IS 'When the occupancy period started';
COMMENT ON COLUMN public.properties.occupancy_end_date IS 'When the occupancy period ends (calculated from paid_months)';
COMMENT ON COLUMN public.properties.paid_months IS 'Number of months paid for';
COMMENT ON COLUMN public.properties.last_payment_date IS 'Date of last payment';
COMMENT ON COLUMN public.properties.can_extend_occupancy IS 'Whether admin/landlord can manually extend the occupancy period';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_properties_is_occupied ON public.properties(is_occupied);
CREATE INDEX IF NOT EXISTS idx_properties_occupied_by ON public.properties(occupied_by);
CREATE INDEX IF NOT EXISTS idx_properties_occupancy_end_date ON public.properties(occupancy_end_date);

-- ============================================================================
-- 2. CREATE PROPERTY OCCUPANCY HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_occupancy_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  
  -- Occupancy Period
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  months_paid INTEGER NOT NULL,
  amount_paid_ugx BIGINT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'extended', 'cancelled')),
  
  -- Extension tracking
  original_end_date TIMESTAMPTZ,
  extended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin/Landlord who extended
  extension_reason TEXT,
  extended_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_occupancy_history_property_id ON public.property_occupancy_history(property_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_history_tenant_id ON public.property_occupancy_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_history_status ON public.property_occupancy_history(status);
CREATE INDEX IF NOT EXISTS idx_occupancy_history_end_date ON public.property_occupancy_history(end_date);

-- Enable RLS
ALTER TABLE public.property_occupancy_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view their own occupancy history"
  ON public.property_occupancy_history
  FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all occupancy history"
  ON public.property_occupancy_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Landlords can view occupancy for their properties"
  ON public.property_occupancy_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_occupancy_history.property_id 
      AND host_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. CREATE FUNCTION TO MARK PROPERTY AS OCCUPIED
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_property_as_occupied(
  p_property_id UUID,
  p_tenant_id UUID,
  p_months_paid INTEGER,
  p_amount_paid BIGINT,
  p_payment_transaction_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Calculate end date based on months paid
  v_end_date := NOW() + (p_months_paid || ' months')::INTERVAL;
  
  -- Update property to mark as occupied
  UPDATE public.properties
  SET 
    is_occupied = TRUE,
    occupied_by = p_tenant_id,
    occupancy_start_date = NOW(),
    occupancy_end_date = v_end_date,
    paid_months = p_months_paid,
    last_payment_date = NOW(),
    updated_at = NOW()
  WHERE id = p_property_id;
  
  -- Create occupancy history record
  INSERT INTO public.property_occupancy_history (
    property_id,
    tenant_id,
    payment_transaction_id,
    start_date,
    end_date,
    months_paid,
    amount_paid_ugx,
    status
  ) VALUES (
    p_property_id,
    p_tenant_id,
    p_payment_transaction_id,
    NOW(),
    v_end_date,
    p_months_paid,
    p_amount_paid,
    'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE FUNCTION TO EXTEND OCCUPANCY PERIOD
-- ============================================================================

CREATE OR REPLACE FUNCTION extend_property_occupancy(
  p_property_id UUID,
  p_additional_months INTEGER,
  p_extended_by UUID,
  p_extension_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_current_end_date TIMESTAMPTZ;
  v_new_end_date TIMESTAMPTZ;
  v_current_occupancy_id UUID;
BEGIN
  -- Get current end date
  SELECT occupancy_end_date INTO v_current_end_date
  FROM public.properties
  WHERE id = p_property_id AND is_occupied = TRUE;
  
  IF v_current_end_date IS NULL THEN
    RAISE EXCEPTION 'Property is not currently occupied';
  END IF;
  
  -- Calculate new end date
  v_new_end_date := v_current_end_date + (p_additional_months || ' months')::INTERVAL;
  
  -- Update property
  UPDATE public.properties
  SET 
    occupancy_end_date = v_new_end_date,
    paid_months = paid_months + p_additional_months,
    updated_at = NOW()
  WHERE id = p_property_id;
  
  -- Get current active occupancy history record
  SELECT id INTO v_current_occupancy_id
  FROM public.property_occupancy_history
  WHERE property_id = p_property_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Update occupancy history
  UPDATE public.property_occupancy_history
  SET 
    end_date = v_new_end_date,
    months_paid = months_paid + p_additional_months,
    status = 'extended',
    original_end_date = COALESCE(original_end_date, v_current_end_date),
    extended_by = p_extended_by,
    extension_reason = p_extension_reason,
    extended_at = NOW(),
    updated_at = NOW()
  WHERE id = v_current_occupancy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE FUNCTION TO CHECK AND EXPIRE OCCUPANCIES
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_completed_occupancies()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  -- Mark properties as available when occupancy period expires
  UPDATE public.properties
  SET 
    is_occupied = FALSE,
    occupied_by = NULL,
    occupancy_start_date = NULL,
    occupancy_end_date = NULL,
    paid_months = 0,
    last_payment_date = NULL,
    updated_at = NOW()
  WHERE is_occupied = TRUE 
    AND occupancy_end_date <= NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  -- Update occupancy history status
  UPDATE public.property_occupancy_history
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status IN ('active', 'extended') 
    AND end_date <= NOW();
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE SCHEDULED JOB TO AUTO-EXPIRE OCCUPANCIES (Using pg_cron if available)
-- ============================================================================

-- Note: This requires pg_cron extension. If not available, implement in application code
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- Schedule to run daily at midnight
-- SELECT cron.schedule('expire-property-occupancies', '0 0 * * *', 'SELECT expire_completed_occupancies();');

-- ============================================================================
-- 7. ADD COMMENT AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION mark_property_as_occupied IS 'Marks a property as occupied when payment is successfully completed';
COMMENT ON FUNCTION extend_property_occupancy IS 'Allows admin/landlord to manually extend property occupancy period';
COMMENT ON FUNCTION expire_completed_occupancies IS 'Automatically expires occupancies when the paid period ends';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
