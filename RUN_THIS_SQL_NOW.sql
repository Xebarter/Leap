-- ============================================================================
-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE SQL EDITOR
-- ============================================================================
-- This will fix the "Failed to create tenant profile" error
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query
-- Paste this entire file and click RUN
-- ============================================================================

-- Step 1: Create the tenant_profiles table
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  phone_number TEXT,
  date_of_birth DATE,
  national_id TEXT,
  national_id_type TEXT CHECK (national_id_type IN ('Passport', 'National ID', 'Driving License', 'Other')),
  home_address TEXT,
  home_city TEXT,
  home_district TEXT,
  home_postal_code TEXT,
  employment_status TEXT DEFAULT 'Employed' CHECK (employment_status IN ('Employed', 'Self-Employed', 'Student', 'Unemployed', 'Retired', 'Other')),
  employer_name TEXT,
  employer_contact TEXT,
  employment_start_date DATE,
  monthly_income_ugx BIGINT,
  employment_type TEXT CHECK (employment_type IN ('Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_date TIMESTAMPTZ,
  verified_by UUID,
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'sms', 'whatsapp', 'phone', 'all')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add foreign key constraint (if profiles table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE public.tenant_profiles 
    DROP CONSTRAINT IF EXISTS tenant_profiles_user_id_fkey;
    
    ALTER TABLE public.tenant_profiles 
    ADD CONSTRAINT tenant_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Enable Row Level Security
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "tenant_all" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can delete their own profile" ON public.tenant_profiles;

-- Step 5: Create a single comprehensive policy (simplest approach)
CREATE POLICY "tenant_all_operations" 
ON public.tenant_profiles
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 6: Grant all permissions
GRANT ALL ON public.tenant_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user_id ON public.tenant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_status ON public.tenant_profiles(status);

-- Step 8: Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_tenant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenant_profiles_updated_at ON public.tenant_profiles;

CREATE TRIGGER trigger_update_tenant_profiles_updated_at
  BEFORE UPDATE ON public.tenant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_profiles_updated_at();

-- ============================================================================
-- VERIFICATION - Check if everything is set up correctly
-- ============================================================================

SELECT 
  'Step 1: Table exists' as step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_profiles')
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
UNION ALL
SELECT 
  'Step 2: RLS enabled' as step,
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'tenant_profiles')
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result
UNION ALL
SELECT 
  'Step 3: Policies exist' as step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_profiles')
    THEN '✅ PASS (' || COUNT(*)::text || ' policies)' 
    ELSE '❌ FAIL' 
  END as result
FROM pg_policies WHERE tablename = 'tenant_profiles'
UNION ALL
SELECT 
  'Step 4: Permissions granted' as step,
  CASE 
    WHEN has_table_privilege('authenticated', 'public.tenant_profiles', 'INSERT')
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as result;

-- ============================================================================
-- If all results show ✅ PASS, you're ready to go!
-- Go back to your app and try saving your profile again.
-- ============================================================================
