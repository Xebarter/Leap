-- ============================================================================
-- FIX MISSING PROFILE ERROR
-- ============================================================================
-- This fixes: "violates foreign key constraint tenant_profiles_user_id_fkey"
-- Error Code: 23503
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this ENTIRE file
-- 4. Click "RUN"
-- ============================================================================

-- Step 1: Find all users in auth.users who DON'T have a profile
SELECT 
  '🔍 Step 1: Finding users without profiles...' as step,
  COUNT(*) as missing_profiles_count
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Step 2: Show which users are missing profiles
SELECT 
  '📋 Step 2: Users missing profiles:' as info,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Step 3: Create profiles for ALL users who don't have one
INSERT INTO public.profiles (
  id, 
  email, 
  full_name,
  is_admin, 
  role, 
  created_at, 
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  false,
  'tenant',
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Step 4: Verify all profiles now exist
SELECT 
  '✅ Step 4: Verification' as step,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ ALL USERS HAVE PROFILES!'
    ELSE '⚠️ Still missing some profiles'
  END as status;

-- Step 5: Ensure the handle_new_user trigger exists for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    false,
    'tenant',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify trigger is enabled
SELECT 
  '🔧 Step 7: Trigger status' as check,
  tgname as trigger_name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    WHEN tgenabled = 'D' THEN '❌ Disabled'
    ELSE '⚠️ Unknown status'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
SELECT 
  '══════════════════════════════════════════════════════════' as divider;

SELECT 
  '✅ FINAL CHECK - Everything should show ✅' as status;

SELECT 
  'All users have profiles' as check_item,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ YES (' || (SELECT COUNT(*) FROM public.profiles)::text || ' profiles)' 
    ELSE '❌ NO - ' || (SELECT COUNT(*) FROM auth.users)::text || ' users, ' || (SELECT COUNT(*) FROM public.profiles)::text || ' profiles'
  END as result
UNION ALL
SELECT 
  'Trigger exists' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ YES' 
    ELSE '❌ NO - Contact support' 
  END as result
UNION ALL
SELECT 
  'Trigger enabled' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created' 
      AND tgenabled = 'O'
    )
    THEN '✅ YES' 
    ELSE '❌ NO - Contact support' 
  END as result
UNION ALL
SELECT 
  'Function exists' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ YES' 
    ELSE '❌ NO - Contact support' 
  END as result;

-- ============================================================================
-- ✅ If all checks show "✅ YES", go back to your app and try saving again!
-- ============================================================================
