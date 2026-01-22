-- ============================================================================
-- COMPREHENSIVE TENANTS MANAGEMENT SCHEMA FOR SUPABASE
-- ============================================================================
-- This schema handles all tenant-related aspects:
-- - Tenant profiles and KYC information
-- - Tenant documents (ID, references, etc.)
-- - Tenant payment history and dues
-- - Tenant notifications
-- - Tenant site visits
-- ============================================================================

-- ============================================================================
-- 1. TENANT PROFILES TABLE - Extended tenant information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Information
  phone_number TEXT,
  date_of_birth DATE,
  national_id TEXT UNIQUE,
  national_id_type TEXT CHECK (national_id_type IN ('Passport', 'National ID', 'Driving License', 'Other')),
  
  -- Address Information
  home_address TEXT,
  home_city TEXT,
  home_district TEXT,
  home_postal_code TEXT,
  
  -- Employment Information
  employment_status TEXT DEFAULT 'Employed' CHECK (employment_status IN ('Employed', 'Self-Employed', 'Student', 'Unemployed', 'Retired', 'Other')),
  employer_name TEXT,
  employer_contact TEXT,
  employment_start_date DATE,
  
  -- Financial Information
  monthly_income_ugx BIGINT,
  employment_type TEXT CHECK (employment_type IN ('Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Other')),
  
  -- Tenant Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Contact Preferences
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'sms', 'whatsapp', 'phone', 'all')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user_id ON public.tenant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_national_id ON public.tenant_profiles(national_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_status ON public.tenant_profiles(status);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_verification_status ON public.tenant_profiles(verification_status);

-- Enable RLS
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_profiles
CREATE POLICY "Tenants can view their own profile" ON public.tenant_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenant profiles" ON public.tenant_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Tenants can update their own profile" ON public.tenant_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update tenant profiles" ON public.tenant_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 2. TENANT DOCUMENTS TABLE - Document storage and tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_profile_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Document Information
  document_type TEXT NOT NULL CHECK (document_type IN (
    'National ID', 'Passport', 'Driving License', 'Employment Letter',
    'Pay Slip', 'Bank Statement', 'Tenant Reference', 'Employer Reference',
    'Medical Report', 'Police Clearance', 'Other'
  )),
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_storage_path TEXT,
  
  -- Document Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expiry_date DATE,
  
  -- Metadata
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant_id ON public.tenant_documents(tenant_profile_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_type ON public.tenant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_status ON public.tenant_documents(status);

-- Enable RLS
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_documents
CREATE POLICY "Tenants can view their own documents" ON public.tenant_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_profiles tp
      WHERE tp.id = tenant_documents.tenant_profile_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all documents" ON public.tenant_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Tenants can upload their own documents" ON public.tenant_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_profiles tp
      WHERE tp.id = tenant_documents.tenant_profile_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all documents" ON public.tenant_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 3. TENANT REFERENCES TABLE - Contact references for verification
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_profile_id UUID REFERENCES public.tenant_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference Information
  reference_type TEXT NOT NULL CHECK (reference_type IN ('Employer', 'Previous Landlord', 'Personal', 'Professional')),
  reference_name TEXT NOT NULL,
  reference_title TEXT,  -- e.g., "HR Manager", "Landlord"
  reference_company TEXT,
  
  -- Contact Information
  reference_email TEXT,
  reference_phone TEXT,
  reference_address TEXT,
  
  -- Verification
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
  verification_date TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_references_tenant_id ON public.tenant_references(tenant_profile_id);
CREATE INDEX IF NOT EXISTS idx_tenant_references_type ON public.tenant_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_tenant_references_verification_status ON public.tenant_references(verification_status);

-- Enable RLS
ALTER TABLE public.tenant_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_references
CREATE POLICY "Tenants can view their own references" ON public.tenant_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_profiles tp
      WHERE tp.id = tenant_references.tenant_profile_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all references" ON public.tenant_references
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Tenants can add references" ON public.tenant_references
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_profiles tp
      WHERE tp.id = tenant_references.tenant_profile_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage references" ON public.tenant_references
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 4. TENANT PAYMENTS TABLE - Track rent and other payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Information
  payment_amount_ugx BIGINT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Rent', 'Deposit', 'Maintenance', 'Utilities', 'Other')),
  payment_method TEXT DEFAULT 'Bank Transfer' CHECK (payment_method IN (
    'Bank Transfer', 'Mobile Money', 'Cash', 'Credit Card', 'Check', 'Other'
  )),
  
  -- Payment Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT UNIQUE,
  payment_reference TEXT,
  
  -- Due Information
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_payments_booking_id ON public.tenant_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_id ON public.tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_status ON public.tenant_payments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_due_date ON public.tenant_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_paid_date ON public.tenant_payments(paid_date);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_payment_type ON public.tenant_payments(payment_type);

-- Enable RLS
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_payments
CREATE POLICY "Tenants can view their own payments" ON public.tenant_payments
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all payments" ON public.tenant_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view payments for their properties" ON public.tenant_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.properties p ON p.id = b.property_id
      WHERE b.id = tenant_payments.booking_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. TENANT PAYMENT DUES TABLE - Track outstanding payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_payment_dues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Due Information
  month_year DATE NOT NULL,
  amount_due_ugx BIGINT NOT NULL,
  amount_paid_ugx BIGINT DEFAULT 0,
  amount_balance_ugx BIGINT GENERATED ALWAYS AS (amount_due_ugx - amount_paid_ugx) STORED,
  
  -- Status
  status TEXT DEFAULT 'due' CHECK (status IN ('due', 'partial', 'paid', 'overdue', 'waived')),
  days_overdue INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_payment_dues_booking_id ON public.tenant_payment_dues(booking_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_dues_tenant_id ON public.tenant_payment_dues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_dues_property_id ON public.tenant_payment_dues(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_dues_status ON public.tenant_payment_dues(status);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_dues_month_year ON public.tenant_payment_dues(month_year);

-- Enable RLS
ALTER TABLE public.tenant_payment_dues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_payment_dues
CREATE POLICY "Tenants can view their own dues" ON public.tenant_payment_dues
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all dues" ON public.tenant_payment_dues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view dues for their properties" ON public.tenant_payment_dues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = tenant_payment_dues.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. TENANT NOTICES TABLE - Track notices sent to tenants
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- Notice Information
  notice_type TEXT NOT NULL CHECK (notice_type IN (
    'Payment Reminder', 'Eviction Notice', 'Maintenance Notice', 
    'Lease Renewal', 'Property Inspection', 'General Notice', 'Warning', 'Other'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'read', 'acknowledged', 'expired')),
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  
  -- Dates
  effective_date DATE,
  expiry_date DATE,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_notices_tenant_id ON public.tenant_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_booking_id ON public.tenant_notices(booking_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_property_id ON public.tenant_notices(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_status ON public.tenant_notices(status);
CREATE INDEX IF NOT EXISTS idx_tenant_notices_type ON public.tenant_notices(notice_type);

-- Enable RLS
ALTER TABLE public.tenant_notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_notices
CREATE POLICY "Tenants can view notices sent to them" ON public.tenant_notices
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all notices" ON public.tenant_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view notices for their properties" ON public.tenant_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = tenant_notices.property_id 
      AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TENANT COMPLAINTS TABLE - Track tenant complaints
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Complaint Information
  complaint_type TEXT NOT NULL CHECK (complaint_type IN (
    'Maintenance Issue', 'Neighbor Complaint', 'Noise', 'Cleanliness',
    'Safety Issue', 'Billing Dispute', 'Management Issue', 'Other'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'pending_review')),
  resolution_notes TEXT,
  
  -- Priority
  priority TEXT DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Emergency')),
  
  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Dates
  expected_resolution_date DATE,
  resolved_date DATE,
  
  -- Attachments (JSON array of URLs)
  attachments TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_tenant_id ON public.tenant_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_booking_id ON public.tenant_complaints(booking_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_property_id ON public.tenant_complaints(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_status ON public.tenant_complaints(status);
CREATE INDEX IF NOT EXISTS idx_tenant_complaints_priority ON public.tenant_complaints(priority);

-- Enable RLS
ALTER TABLE public.tenant_complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_complaints
CREATE POLICY "Tenants can view their own complaints" ON public.tenant_complaints
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Admins can view all complaints" ON public.tenant_complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Property hosts can view complaints for their properties" ON public.tenant_complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = tenant_complaints.property_id 
      AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can create complaints" ON public.tenant_complaints
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- ============================================================================
-- 8. TRIGGER FUNCTIONS - Automatic management
-- ============================================================================

-- Function to update tenant_profiles timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_profiles_timestamp
  BEFORE UPDATE ON public.tenant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_profiles_timestamp();

-- Function to update tenant_documents timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_documents_timestamp
  BEFORE UPDATE ON public.tenant_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_documents_timestamp();

-- Function to update tenant_references timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_references_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_references_timestamp
  BEFORE UPDATE ON public.tenant_references
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_references_timestamp();

-- Function to update tenant_payments timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_payments_timestamp
  BEFORE UPDATE ON public.tenant_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_payments_timestamp();

-- Function to update tenant_payment_dues timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_payment_dues_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_payment_dues_timestamp
  BEFORE UPDATE ON public.tenant_payment_dues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_payment_dues_timestamp();

-- Function to update tenant_notices timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_notices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_notices_timestamp
  BEFORE UPDATE ON public.tenant_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_notices_timestamp();

-- Function to update tenant_complaints timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_complaints_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_complaints_timestamp
  BEFORE UPDATE ON public.tenant_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_complaints_timestamp();

-- Function to mark payment due as overdue if past due date and update days_overdue
CREATE OR REPLACE FUNCTION public.update_payment_due_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status to overdue if past month_year and not yet paid
  IF NEW.status IN ('due', 'partial') AND CURRENT_DATE > NEW.month_year THEN
    NEW.status = 'overdue';
    NEW.days_overdue = (CURRENT_DATE - NEW.month_year)::INTEGER;
  ELSIF NEW.status = 'overdue' THEN
    -- Update days_overdue for existing overdue payments
    NEW.days_overdue = (CURRENT_DATE - NEW.month_year)::INTEGER;
  ELSE
    NEW.days_overdue = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_due_status
  BEFORE INSERT OR UPDATE ON public.tenant_payment_dues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_due_status();

-- ============================================================================
-- 9. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Tenant Dashboard Summary
CREATE OR REPLACE VIEW public.tenant_dashboard_summary AS
SELECT 
  tp.id as tenant_id,
  tp.user_id,
  tp.status,
  tp.verification_status,
  (SELECT COUNT(*) FROM public.bookings WHERE tenant_id = tp.user_id AND status IN ('confirmed', 'active')) as active_bookings,
  (SELECT COUNT(*) FROM public.tenant_payments WHERE tenant_id = tp.user_id AND status = 'pending') as pending_payments,
  (SELECT COUNT(*) FROM public.tenant_notices WHERE tenant_id = tp.user_id AND status = 'sent') as unread_notices,
  (SELECT COUNT(*) FROM public.tenant_complaints WHERE tenant_id = tp.user_id AND status IN ('open', 'in_progress')) as open_complaints,
  (SELECT COALESCE(SUM(amount_balance_ugx), 0) FROM public.tenant_payment_dues WHERE tenant_id = tp.user_id AND status IN ('due', 'overdue')) as total_balance_due_ugx,
  (SELECT COUNT(*) FROM public.tenant_payment_dues WHERE tenant_id = tp.user_id AND status = 'overdue') as overdue_payments_count
FROM public.tenant_profiles tp;

-- View: Tenant Payment Summary
CREATE OR REPLACE VIEW public.tenant_payment_summary AS
SELECT 
  tp.id as tenant_id,
  COUNT(CASE WHEN tpd.status = 'paid' THEN 1 END) as payments_completed,
  COUNT(CASE WHEN tpd.status = 'due' THEN 1 END) as payments_due,
  COUNT(CASE WHEN tpd.status = 'overdue' THEN 1 END) as payments_overdue,
  COALESCE(SUM(CASE WHEN tpd.status = 'paid' THEN tpd.amount_paid_ugx ELSE 0 END), 0) as total_paid_ugx,
  COALESCE(SUM(CASE WHEN tpd.status IN ('due', 'overdue') THEN tpd.amount_balance_ugx ELSE 0 END), 0) as total_outstanding_ugx
FROM public.tenant_profiles tp
LEFT JOIN public.tenant_payment_dues tpd ON tp.user_id = tpd.tenant_id
GROUP BY tp.id;

-- View: Tenant Verification Status
CREATE OR REPLACE VIEW public.tenant_verification_status AS
SELECT 
  tp.id as tenant_id,
  tp.user_id,
  tp.verification_status,
  (SELECT COUNT(*) FROM public.tenant_documents WHERE tenant_profile_id = tp.id AND status = 'approved') as approved_documents,
  (SELECT COUNT(*) FROM public.tenant_documents WHERE tenant_profile_id = tp.id AND status = 'pending') as pending_documents,
  (SELECT COUNT(*) FROM public.tenant_documents WHERE tenant_profile_id = tp.id AND status = 'rejected') as rejected_documents,
  (SELECT COUNT(*) FROM public.tenant_references WHERE tenant_profile_id = tp.id AND verification_status = 'verified') as verified_references
FROM public.tenant_profiles tp;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.update_tenant_profiles_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_documents_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_references_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_payments_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_payment_dues_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_notices_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_complaints_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_due_status() TO authenticated;

GRANT SELECT ON public.tenant_profiles TO authenticated;
GRANT SELECT ON public.tenant_documents TO authenticated;
GRANT SELECT ON public.tenant_references TO authenticated;
GRANT SELECT ON public.tenant_payments TO authenticated;
GRANT SELECT ON public.tenant_payment_dues TO authenticated;
GRANT SELECT ON public.tenant_notices TO authenticated;
GRANT SELECT ON public.tenant_complaints TO authenticated;

GRANT SELECT ON public.tenant_dashboard_summary TO authenticated;
GRANT SELECT ON public.tenant_payment_summary TO authenticated;
GRANT SELECT ON public.tenant_verification_status TO authenticated;

-- ============================================================================
-- TENANTS SCHEMA COMPLETE
-- ============================================================================
-- This comprehensive schema provides:
-- ✓ Tenant profile management with KYC information
-- ✓ Document management and verification
-- ✓ Tenant references tracking
-- ✓ Payment and dues management
-- ✓ Notices and communications
-- ✓ Complaint management system
-- ✓ Row Level Security (RLS) for data protection
-- ✓ Automatic timestamp and status management
-- ✓ Optimized indexes for query performance
-- ✓ Ready-to-use views for common queries
-- ============================================================================
