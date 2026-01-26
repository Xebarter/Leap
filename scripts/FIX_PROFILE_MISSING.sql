-- ============================================================================
-- FIX MISSING PROFILE ENTRY
-- ============================================================================
-- This fixes the foreign key constraint error by ensuring all auth users
-- have corresponding entries in the profiles table
-- ============================================================================

-- Step 1: Check which authenticated users are missing from profiles table
SELECT 
  'Missing Profiles Check' as status,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Step 2: Create profiles for all auth users that don't have one
INSERT INTO public.profiles (id, email, full_name, is_admin, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  false,
  'tenant',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 3: Verify all users now have profiles
SELECT 
  'Verification' as check_type,
  COUNT(*) as auth_users,
  (SELECT COUNT(*) FROM public.profiles) as profile_entries,
  CASE 
    WHEN COUNT(*) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ All users have profiles'
    ELSE '⚠️ Some users still missing profiles'
  END as result
FROM auth.users;

-- Step 4: Show any remaining issues
SELECT 
  'Users without profiles' as issue,
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Step 5: Fix the foreign key constraint
ALTER TABLE public.tenant_profiles 
DROP CONSTRAINT IF EXISTS tenant_profiles_user_id_fkey;

ALTER TABLE public.tenant_profiles
ADD CONSTRAINT tenant_profiles_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- ============================================================================
-- DONE! All auth users should now have profile entries
-- Try saving your profile again in the app
-- ============================================================================
