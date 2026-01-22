-- =====================================================
-- PROPERTY RESERVATIONS TABLE
-- =====================================================
-- This table manages property reservations where tenants
-- pay 1 month rent upfront to reserve a property
-- =====================================================

-- Drop existing table if needed (for development)
-- DROP TABLE IF EXISTS property_reservations CASCADE;

CREATE TABLE IF NOT EXISTS property_reservations (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Keys
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL, -- Optional: specific unit
  
  -- Reservation Details
  reservation_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., RES-2026-00001
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired', 'completed')),
  
  -- Payment Information
  reservation_amount INTEGER NOT NULL, -- Amount in cents (1 month rent)
  payment_method VARCHAR(50), -- e.g., 'mobile_money', 'bank_transfer', 'card'
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference VARCHAR(100), -- Payment transaction reference
  paid_at TIMESTAMPTZ,
  
  -- Dates
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- Reservation expires after X days
  move_in_date DATE, -- Intended move-in date
  
  -- Contact Information
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  
  -- Additional Information
  notes TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  
  -- Admin Actions
  confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who confirmed
  confirmed_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_reservations_property ON property_reservations(property_id);
CREATE INDEX idx_reservations_tenant ON property_reservations(tenant_id);
CREATE INDEX idx_reservations_status ON property_reservations(status);
CREATE INDEX idx_reservations_payment_status ON property_reservations(payment_status);
CREATE INDEX idx_reservations_reserved_at ON property_reservations(reserved_at DESC);
CREATE INDEX idx_reservations_expires_at ON property_reservations(expires_at);
CREATE INDEX idx_reservations_number ON property_reservations(reservation_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE property_reservations ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own reservations
CREATE POLICY "Tenants can view own reservations"
  ON property_reservations
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Tenants can create reservations
CREATE POLICY "Tenants can create reservations"
  ON property_reservations
  FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Tenants can update their own pending reservations
CREATE POLICY "Tenants can update own pending reservations"
  ON property_reservations
  FOR UPDATE
  USING (auth.uid() = tenant_id AND status = 'pending');

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON property_reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Admins can update any reservation
CREATE POLICY "Admins can update reservations"
  ON property_reservations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate reservation number
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the count of reservations this year
  SELECT COUNT(*) + 1 INTO counter
  FROM property_reservations
  WHERE EXTRACT(YEAR FROM reserved_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: RES-YYYY-NNNNN
  new_number := 'RES-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate reservation number on insert
CREATE OR REPLACE FUNCTION set_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
    NEW.reservation_number := generate_reservation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set reservation number
DROP TRIGGER IF EXISTS trigger_set_reservation_number ON property_reservations;
CREATE TRIGGER trigger_set_reservation_number
  BEFORE INSERT ON property_reservations
  FOR EACH ROW
  EXECUTE FUNCTION set_reservation_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reservation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_reservation_timestamp ON property_reservations;
CREATE TRIGGER trigger_update_reservation_timestamp
  BEFORE UPDATE ON property_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_timestamp();

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all active reservations
-- SELECT * FROM property_reservations WHERE status = 'confirmed' AND expires_at > NOW();

-- Get reservations for a property
-- SELECT * FROM property_reservations WHERE property_id = 'uuid-here' ORDER BY reserved_at DESC;

-- Get tenant's reservations
-- SELECT * FROM property_reservations WHERE tenant_id = 'uuid-here' ORDER BY reserved_at DESC;

-- Get reservations expiring soon (within 7 days)
-- SELECT * FROM property_reservations WHERE status = 'confirmed' AND expires_at <= NOW() + INTERVAL '7 days';

-- Update reservation status
-- UPDATE property_reservations SET status = 'confirmed', confirmed_by = 'admin-uuid', confirmed_at = NOW() WHERE id = 'reservation-uuid';

-- =====================================================
-- NOTES
-- =====================================================
-- * Reservation amount is stored in cents for precision
-- * Reservations expire after a configurable period (e.g., 30 days)
-- * Payment status is tracked separately from reservation status
-- * Admins can confirm, cancel, or extend reservations
-- * Tenants can only view and create their own reservations
-- =====================================================
