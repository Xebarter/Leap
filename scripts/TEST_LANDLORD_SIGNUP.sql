-- ============================================================================
-- TEST SCRIPT: Verify Landlord Signup Flow
-- ============================================================================
-- Run this to verify that landlords are properly created and visible
-- ============================================================================

-- 1. Check if the trigger function exists
SELECT 
  proname as function_name,
  'EXISTS' as status
FROM pg_proc 
WHERE proname = 'create_landlord_profile_on_signup';

-- 2. Check if the trigger is active
SELECT 
  tgname as trigger_name,
  CASE WHEN tgenabled = 'O' THEN 'ENABLED' ELSE 'DISABLED' END as status,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'create_landlord_profile_trigger';

-- 3. List all landlords in profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  user_type,
  is_admin,
  created_at
FROM public.profiles
WHERE role = 'landlord' OR user_type = 'landlord'
ORDER BY created_at DESC;

-- 4. List all landlord_profiles entries
SELECT 
  lp.id as landlord_profile_id,
  lp.user_id,
  p.email,
  p.full_name,
  lp.status,
  lp.verification_status,
  lp.business_name,
  lp.phone_number,
  lp.total_properties,
  lp.created_at
FROM public.landlord_profiles lp
LEFT JOIN public.profiles p ON lp.user_id = p.id
ORDER BY lp.created_at DESC;

-- 5. Find landlords WITHOUT landlord_profiles (this should be empty after fix)
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.user_type,
  'MISSING LANDLORD_PROFILE' as issue
FROM public.profiles p
LEFT JOIN public.landlord_profiles lp ON p.id = lp.user_id
WHERE (p.role = 'landlord' OR p.user_type = 'landlord')
  AND lp.id IS NULL;

-- 6. Check RLS policies on landlord_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'landlord_profiles'
ORDER BY policyname;
