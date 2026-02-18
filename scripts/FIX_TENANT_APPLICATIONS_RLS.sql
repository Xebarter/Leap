-- =====================================================
-- FIX TENANT APPLICATIONS RLS POLICIES
-- =====================================================
-- The issue: Policies were trying to query auth.users table
-- which regular users don't have permission to access.
-- 
-- Solution: Remove the auth.users queries since applicant_id
-- is already set correctly when authenticated users apply.
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own applications" ON tenant_applications;
DROP POLICY IF EXISTS "Authenticated users can create applications" ON tenant_applications;
DROP POLICY IF EXISTS "Users can update own pending applications" ON tenant_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON tenant_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON tenant_applications;

-- Users can view their own applications (simplified)
CREATE POLICY "Users can view own applications"
  ON tenant_applications
  FOR SELECT
  USING (
    auth.uid() = applicant_id
  );

-- Authenticated users can create applications
CREATE POLICY "Authenticated users can create applications"
  ON tenant_applications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = applicant_id
  );

-- Users can update their own pending applications (simplified)
CREATE POLICY "Users can update own pending applications"
  ON tenant_applications
  FOR UPDATE
  USING (
    auth.uid() = applicant_id AND
    status = 'pending'
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

-- Admins can delete applications
CREATE POLICY "Admins can delete applications"
  ON tenant_applications
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'tenant_applications'
ORDER BY policyname;
