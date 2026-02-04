-- ============================================================================
-- LANDLORDS MANAGEMENT SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema handles landlord/property owner management:
-- - Landlord profiles with detailed information
-- - Integration with properties table
-- - Payment and commission tracking
-- - Verification and approval system
-- ============================================================================

-- ============================================================================
-- 1. LANDLORD PROFILES TABLE - Extended information for landlords
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Personal/Business Information
  business_name TEXT,  -- Optional: for companies/property management businesses
  business_registration_number TEXT,  -- Business registration or tax ID
  phone_number TEXT,
  alternative_phone TEXT,
  
  -- Address Information
  business_address TEXT,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  
  -- Banking Information for payments
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  mobile_money_number TEXT,
  mobile_money_provider TEXT CHECK (mobile_money_provider IN ('MTN', 'Airtel', NULL)),
  
  -- Verification and Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'blacklisted')),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  verification_notes TEXT,
  
  -- Identity Documents
  id_document_type TEXT CHECK (id_document_type IN ('Passport', 'National ID', 'Driving License', 'Business License', 'Other')),
  id_document_number TEXT,
  id_document_url TEXT,  -- URL to uploaded ID document
  
  -- Commission and Payment Settings
  commission_rate DECIMAL(5,2) DEFAULT 10.00,  -- Percentage commission rate (default 10%)
  payment_schedule TEXT DEFAULT 'monthly' CHECK (payment_schedule IN ('weekly', 'monthly', 'quarterly', 'annually')),
  
  -- Statistics (updated via triggers/functions)
  total_properties INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  total_revenue_ugx BIGINT DEFAULT 0,
  total_commission_paid_ugx BIGINT DEFAULT 0,
  
  -- Preferences
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'sms', 'whatsapp', 'phone', 'all')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  notes TEXT,  -- Admin notes about this landlord
  rating DECIMAL(3,2) DEFAULT 0.00,  -- Average rating (0-5)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_user_id ON public.landlord_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_status ON public.landlord_profiles(status);
CREATE INDEX IF NOT EXISTS idx_landlord_profiles_verification_status ON public.landlord_profiles(verification_status);

-- ============================================================================
-- 2. ADD LANDLORD_ID TO PROPERTIES TABLE
-- ============================================================================
-- Add landlord_id column to properties table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='properties' AND column_name='landlord_id') THEN
        ALTER TABLE public.properties ADD COLUMN landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON public.properties(landlord_id);
    END IF;
END $$;

-- ============================================================================
-- 3. LANDLORD PAYMENTS TABLE - Track commission payments to landlords
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.landlord_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  amount_ugx BIGINT NOT NULL,
  commission_rate DECIMAL(5,2),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Payment Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash', 'cheque')),
  transaction_reference TEXT,
  
  -- Payment Details
  paid_date TIMESTAMPTZ,
  paid_by UUID REFERENCES public.profiles(id),
  
  -- Metadata
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_landlord_payments_landlord_id ON public.landlord_payments(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_payments_status ON public.landlord_payments(status);
CREATE INDEX IF NOT EXISTS idx_landlord_payments_period ON public.landlord_payments(period_start, period_end);

-- ============================================================================
-- 4. LANDLORD DOCUMENTS TABLE - Store verification and legal documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.landlord_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID REFERENCES public.landlord_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Document Information
  document_type TEXT NOT NULL CHECK (document_type IN (
    'id_document', 'business_license', 'tax_certificate', 'property_title', 
    'proof_of_ownership', 'contract', 'other'
  )),
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_landlord_documents_landlord_id ON public.landlord_documents(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_documents_type ON public.landlord_documents(document_type);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all landlord profiles" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Landlords can view their own profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Admins can insert landlord profiles" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Landlords can update their own profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Admins can update all landlord profiles" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Admins can delete landlord profiles" ON public.landlord_profiles;

-- Landlord Profiles Policies
CREATE POLICY "Admins can view all landlord profiles" ON public.landlord_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Landlords can view their own profile" ON public.landlord_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can insert landlord profiles" ON public.landlord_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Landlords can update their own profile" ON public.landlord_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all landlord profiles" ON public.landlord_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete landlord profiles" ON public.landlord_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Landlord Payments Policies
DROP POLICY IF EXISTS "Admins can view all landlord payments" ON public.landlord_payments;
DROP POLICY IF EXISTS "Landlords can view their own payments" ON public.landlord_payments;
DROP POLICY IF EXISTS "Admins can manage landlord payments" ON public.landlord_payments;

CREATE POLICY "Admins can view all landlord payments" ON public.landlord_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Landlords can view their own payments" ON public.landlord_payments
  FOR SELECT USING (
    landlord_id IN (
      SELECT id FROM public.landlord_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage landlord payments" ON public.landlord_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Landlord Documents Policies
DROP POLICY IF EXISTS "Admins can view all landlord documents" ON public.landlord_documents;
DROP POLICY IF EXISTS "Landlords can view their own documents" ON public.landlord_documents;
DROP POLICY IF EXISTS "Landlords can upload their own documents" ON public.landlord_documents;
DROP POLICY IF EXISTS "Admins can manage all landlord documents" ON public.landlord_documents;

CREATE POLICY "Admins can view all landlord documents" ON public.landlord_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Landlords can view their own documents" ON public.landlord_documents
  FOR SELECT USING (
    landlord_id IN (
      SELECT id FROM public.landlord_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can upload their own documents" ON public.landlord_documents
  FOR INSERT WITH CHECK (
    landlord_id IN (
      SELECT id FROM public.landlord_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all landlord documents" ON public.landlord_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landlord_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS landlord_profiles_updated_at ON public.landlord_profiles;
CREATE TRIGGER landlord_profiles_updated_at
  BEFORE UPDATE ON public.landlord_profiles
  FOR EACH ROW EXECUTE FUNCTION update_landlord_updated_at();

DROP TRIGGER IF EXISTS landlord_payments_updated_at ON public.landlord_payments;
CREATE TRIGGER landlord_payments_updated_at
  BEFORE UPDATE ON public.landlord_payments
  FOR EACH ROW EXECUTE FUNCTION update_landlord_updated_at();

DROP TRIGGER IF EXISTS landlord_documents_updated_at ON public.landlord_documents;
CREATE TRIGGER landlord_documents_updated_at
  BEFORE UPDATE ON public.landlord_documents
  FOR EACH ROW EXECUTE FUNCTION update_landlord_updated_at();

-- Function to update landlord statistics
CREATE OR REPLACE FUNCTION update_landlord_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update property and unit counts for the landlord
  UPDATE public.landlord_profiles
  SET 
    total_properties = (
      SELECT COUNT(*) FROM public.properties 
      WHERE landlord_id = NEW.landlord_id OR landlord_id = OLD.landlord_id
    ),
    total_units = (
      SELECT COUNT(*) FROM public.property_units pu
      JOIN public.properties p ON pu.property_id = p.id
      WHERE p.landlord_id = NEW.landlord_id OR p.landlord_id = OLD.landlord_id
    )
  WHERE id = COALESCE(NEW.landlord_id, OLD.landlord_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when properties change
DROP TRIGGER IF EXISTS update_landlord_stats_on_property_change ON public.properties;
CREATE TRIGGER update_landlord_stats_on_property_change
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_landlord_stats();

-- ============================================================================
-- 7. VIEWS FOR LANDLORD ANALYTICS
-- ============================================================================

-- View: Landlord overview with user details
CREATE OR REPLACE VIEW landlord_overview AS
SELECT 
  lp.*,
  p.full_name,
  p.email,
  p.avatar_url,
  p.role,
  (SELECT COUNT(*) FROM public.properties WHERE landlord_id = lp.id) as properties_count,
  (SELECT COUNT(*) FROM public.property_units pu 
   JOIN public.properties prop ON pu.property_id = prop.id 
   WHERE prop.landlord_id = lp.id) as units_count,
  (SELECT COUNT(*) FROM public.landlord_payments WHERE landlord_id = lp.id AND status = 'completed') as completed_payments_count
FROM public.landlord_profiles lp
LEFT JOIN public.profiles p ON lp.user_id = p.id;

-- ============================================================================
-- 8. INITIAL DATA (OPTIONAL)
-- ============================================================================
-- Uncomment to create sample landlord profiles for testing

/*
-- Create a test landlord profile (assumes you have a user with role 'landlord')
INSERT INTO public.landlord_profiles (
  user_id, 
  business_name, 
  phone_number, 
  status, 
  verification_status
) 
SELECT 
  id, 
  'Sample Property Management', 
  '+256700000000', 
  'active', 
  'verified'
FROM public.profiles 
WHERE role = 'landlord' 
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('landlord_profiles', 'landlord_payments', 'landlord_documents')
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('landlord_profiles', 'landlord_payments', 'landlord_documents')
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run this script in your Supabase SQL editor
-- 2. Ensure profiles table exists before running this script
-- 3. Update user roles to 'landlord' for landlord users
-- 4. Configure storage bucket for document uploads
-- 5. Adjust commission rates and payment schedules as needed
-- ============================================================================
