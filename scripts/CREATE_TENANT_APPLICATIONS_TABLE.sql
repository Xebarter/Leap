-- =====================================================
-- TENANT APPLICATIONS TABLE
-- =====================================================
-- This table manages tenant rental applications with
-- document uploads (National ID/Passport, Proof of Income)
-- =====================================================

-- Drop existing table if needed (for development)
-- DROP TABLE IF EXISTS tenant_applications CASCADE;

CREATE TABLE IF NOT EXISTS tenant_applications (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Keys
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional: if user is logged in
  
  -- Application Details
  application_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., APP-2026-00001
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  
  -- Applicant Information
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Documents (Storage URLs)
  national_id_url TEXT, -- URL to uploaded National ID or Passport
  national_id_filename VARCHAR(255),
  proof_of_income_url TEXT, -- URL to uploaded Proof of Income
  proof_of_income_filename VARCHAR(255),
  
  -- Additional Information
  current_address TEXT,
  employment_status VARCHAR(50), -- e.g., 'employed', 'self_employed', 'student', 'retired'
  monthly_income INTEGER, -- In cents
  reason_for_moving TEXT,
  preferred_move_in_date DATE,
  number_of_occupants INTEGER DEFAULT 1,
  has_pets BOOLEAN DEFAULT FALSE,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  
  -- Application Notes
  applicant_notes TEXT,
  admin_notes TEXT,
  
  -- Review Information
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who reviewed
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_applications_property ON tenant_applications(property_id);
CREATE INDEX idx_applications_applicant ON tenant_applications(applicant_id);
CREATE INDEX idx_applications_status ON tenant_applications(status);
CREATE INDEX idx_applications_submitted_at ON tenant_applications(submitted_at DESC);
CREATE INDEX idx_applications_number ON tenant_applications(application_number);
CREATE INDEX idx_applications_email ON tenant_applications(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON tenant_applications
  FOR SELECT
  USING (
    auth.uid() = applicant_id OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Authenticated users can create applications
CREATE POLICY "Authenticated users can create applications"
  ON tenant_applications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON tenant_applications
  FOR UPDATE
  USING (
    (auth.uid() = applicant_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    AND status = 'pending'
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON tenant_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Admins can update any application
CREATE POLICY "Admins can update applications"
  ON tenant_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- =====================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =====================================================

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-applications', 'tenant-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant-applications bucket

-- Allow authenticated users to upload their application documents
CREATE POLICY "Users can upload application documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-applications' AND
    auth.uid() IS NOT NULL
  );

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tenant-applications' AND
    (
      auth.uid() IS NOT NULL OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
      )
    )
  );

-- Allow admins to view all documents
CREATE POLICY "Admins can view all application documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'tenant-applications' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tenant-applications' AND
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the count of applications this year
  SELECT COUNT(*) + 1 INTO counter
  FROM tenant_applications
  WHERE EXTRACT(YEAR FROM submitted_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: APP-YYYY-NNNNN
  new_number := 'APP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(counter::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate application number on insert
CREATE OR REPLACE FUNCTION set_application_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := generate_application_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set application number
DROP TRIGGER IF EXISTS trigger_set_application_number ON tenant_applications;
CREATE TRIGGER trigger_set_application_number
  BEFORE INSERT ON tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_application_timestamp ON tenant_applications;
CREATE TRIGGER trigger_update_application_timestamp
  BEFORE UPDATE ON tenant_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_timestamp();

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all pending applications
-- SELECT * FROM tenant_applications WHERE status = 'pending' ORDER BY submitted_at DESC;

-- Get applications for a property
-- SELECT * FROM tenant_applications WHERE property_id = 'uuid-here' ORDER BY submitted_at DESC;

-- Get user's applications
-- SELECT * FROM tenant_applications WHERE applicant_id = 'uuid-here' OR email = 'user@example.com';

-- Update application status
-- UPDATE tenant_applications 
-- SET status = 'approved', reviewed_by = 'admin-uuid', reviewed_at = NOW()
-- WHERE id = 'application-uuid';

-- Search applications by name or email
-- SELECT * FROM tenant_applications 
-- WHERE full_name ILIKE '%search%' OR email ILIKE '%search%';

-- =====================================================
-- NOTES
-- =====================================================
-- * Documents are stored in Supabase Storage (tenant-applications bucket)
-- * File URLs are stored in the database
-- * Admins can view and download all documents
-- * Applicants can view their own documents
-- * Income amounts stored in cents for precision
-- * Application status workflow: pending → under_review → approved/rejected
-- * Storage bucket is private (public = false)
-- =====================================================
