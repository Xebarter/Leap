-- ============================================================================
-- FIX TENANT PROFILE INSERT POLICY
-- ============================================================================
-- This fixes the "Failed to create tenant profile" error
-- by ensuring proper INSERT permissions
-- ============================================================================

-- First, check if the table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_profiles') THEN
        RAISE NOTICE 'ERROR: tenant_profiles table does not exist! Run TENANTS_SCHEMA.sql first!';
    ELSE
        RAISE NOTICE 'tenant_profiles table exists ✓';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policies
DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users during signup" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Users can insert their own tenant profile" ON public.tenant_profiles;

-- Create comprehensive INSERT policy for tenants
CREATE POLICY "Tenants can insert their own profile" 
ON public.tenant_profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create INSERT policy for admins
CREATE POLICY "Admins can insert tenant profiles" 
ON public.tenant_profiles
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tenant_profiles'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Grant INSERT permission
GRANT INSERT ON public.tenant_profiles TO authenticated;

-- Test: Show what policies exist now
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has check ✓'
    ELSE 'No check ✗'
  END as status
FROM pg_policies 
WHERE tablename = 'tenant_profiles'
ORDER BY cmd, policyname;
