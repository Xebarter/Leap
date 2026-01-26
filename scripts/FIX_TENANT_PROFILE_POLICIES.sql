-- ============================================================================
-- FIX TENANT PROFILE RLS POLICIES
-- ============================================================================
-- Run this if you're getting permission errors on the tenant profile page
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can view all tenant profiles" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenant_profiles;

-- Enable RLS
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tenants can view their own profile
CREATE POLICY "Tenants can view their own profile" 
ON public.tenant_profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all tenant profiles
CREATE POLICY "Admins can view all tenant profiles" 
ON public.tenant_profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy 3: Tenants can update their own profile
CREATE POLICY "Tenants can update their own profile" 
ON public.tenant_profiles
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy 4: Admins can update tenant profiles
CREATE POLICY "Admins can update tenant profiles" 
ON public.tenant_profiles
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy 5: Tenants can insert their own profile
CREATE POLICY "Tenants can insert their own profile" 
ON public.tenant_profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 6: Admins can insert tenant profiles
CREATE POLICY "Admins can insert tenant profiles" 
ON public.tenant_profiles
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy 7: Tenants can delete their own profile
CREATE POLICY "Tenants can delete their own profile" 
ON public.tenant_profiles
FOR DELETE 
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'tenant_profiles'
ORDER BY policyname;
