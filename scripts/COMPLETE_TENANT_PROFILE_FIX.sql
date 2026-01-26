-- ============================================================================
-- COMPLETE TENANT PROFILE FIX - RUNS EVERYTHING NEEDED
-- ============================================================================
-- Run this entire script in Supabase SQL Editor to fix all issues
-- ============================================================================

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Information
  phone_number TEXT,
  date_of_birth DATE,
  national_id TEXT,
  national_id_type TEXT,
  
  -- Address Information
  home_address TEXT,
  home_city TEXT,
  home_district TEXT,
  home_postal_code TEXT,
  
  -- Employment Information
  employment_status TEXT DEFAULT 'Employed',
  employer_name TEXT,
  employer_contact TEXT,
  employment_start_date DATE,
  monthly_income_ugx BIGINT,
  employment_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  verification_status TEXT DEFAULT 'unverified',
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Preferences
  preferred_communication TEXT DEFAULT 'email',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can delete their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.tenant_profiles;

-- 4. Create fresh policies with correct permissions
CREATE POLICY "Tenants can insert their own profile" 
ON public.tenant_profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can view their own profile" 
ON public.tenant_profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Tenants can update their own profile" 
ON public.tenant_profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Tenants can delete their own profile" 
ON public.tenant_profiles
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tenant profiles" 
ON public.tenant_profiles
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update tenant profiles" 
ON public.tenant_profiles
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 5. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user_id ON public.tenant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_status ON public.tenant_profiles(status);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_verification_status ON public.tenant_profiles(verification_status);

-- 7. Create update trigger
CREATE OR REPLACE FUNCTION public.update_tenant_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenant_profiles_timestamp ON public.tenant_profiles;

CREATE TRIGGER trigger_update_tenant_profiles_timestamp
  BEFORE UPDATE ON public.tenant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_profiles_timestamp();

-- 8. Verify setup
SELECT 
  'Table exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'tenant_profiles'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'RLS enabled' as check_item,
  CASE WHEN (
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = 'tenant_profiles'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'INSERT policy exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tenant_profiles' 
    AND cmd = 'INSERT'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'SELECT policy exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tenant_profiles' 
    AND cmd = 'SELECT'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'UPDATE policy exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'tenant_profiles' 
    AND cmd = 'UPDATE'
  ) THEN '✓ YES' ELSE '✗ NO' END as status;

-- Done! All checks should show ✓ YES
