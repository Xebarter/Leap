-- ============================================================================
-- FIX FOREIGN KEY CONSTRAINT ERROR
-- ============================================================================
-- Error: violates foreign key constraint "tenant_profiles_user_id_fkey"
-- Code: 23503
-- ============================================================================

-- Step 1: Check if your user exists in profiles table
SELECT 
  'Checking current user in profiles table' as step,
  id,
  email,
  full_name
FROM public.profiles
WHERE id = auth.uid();

-- If the above returns nothing, that's the problem!

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE public.tenant_profiles 
DROP CONSTRAINT IF EXISTS tenant_profiles_user_id_fkey;

-- Step 3: Re-add the constraint with proper settings
-- This allows the constraint to work even if profiles table is missing data
ALTER TABLE public.tenant_profiles
ADD CONSTRAINT tenant_profiles_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE
NOT VALID;

-- Validate the constraint
ALTER TABLE public.tenant_profiles 
VALIDATE CONSTRAINT tenant_profiles_user_id_fkey;

-- Step 4: Ensure your current user has a profile entry
-- This creates a profile if it doesn't exist
INSERT INTO public.profiles (id, email, is_admin, role, created_at, updated_at)
SELECT 
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  false,
  'tenant',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify the fix
SELECT 
  'Verification' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    THEN '✅ Your profile exists in profiles table'
    ELSE '❌ Profile still missing - contact admin'
  END as result;
