-- ============================================================================
-- DEBUG TENANT PROFILE INSERT ISSUES
-- ============================================================================
-- Run this to check what's preventing tenant profile creation
-- ============================================================================

-- 1. Check if tenant_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tenant_profiles'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tenant_profiles'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tenant_profiles';

-- 4. Check if user_id column has UNIQUE constraint
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.tenant_profiles'::regclass;

-- 5. Test insert with sample data (replace YOUR_USER_ID with actual user ID)
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then try to insert (replace 'YOUR_USER_ID_HERE' with actual UUID):
/*
INSERT INTO public.tenant_profiles (
  user_id,
  phone_number,
  employment_status,
  preferred_communication
)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  '+256 700 000 000',
  'Employed',
  'email'
)
ON CONFLICT (user_id) DO NOTHING
RETURNING *;
*/

-- 6. Check if there's already a tenant_profile for this user
-- SELECT * FROM public.tenant_profiles WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
