-- ============================================================================
-- FIX LANDLORD SIGNUP ISSUE - Update handle_new_user() Trigger
-- ============================================================================
-- Issue: Landlords were being registered with user_type='tenant'
-- Cause: The handle_new_user() trigger was missing the user_type column
-- Solution: Update the trigger to properly set both role AND user_type
-- ============================================================================

-- ============================================================================
-- 1. ENSURE user_type COLUMN EXISTS
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='user_type'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'tenant';
        RAISE NOTICE 'Added user_type column to profiles table';
    ELSE
        RAISE NOTICE 'user_type column already exists';
    END IF;
END $$;

-- ============================================================================
-- 2. UPDATE THE TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user with BOTH role and user_type
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    is_admin, 
    role,
    user_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false) THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')
    END,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. VERIFY THE TRIGGER EXISTS
-- ============================================================================
-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. FIX EXISTING LANDLORDS (OPTIONAL)
-- ============================================================================
-- If you have existing users who signed up as landlords but have user_type='tenant',
-- uncomment and run this query to fix them:

/*
UPDATE public.profiles 
SET user_type = 'landlord' 
WHERE role = 'landlord' 
  AND (user_type IS NULL OR user_type = 'tenant');
*/

-- ============================================================================
-- 5. VERIFY THE FIX
-- ============================================================================
-- Check the trigger function
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check the trigger
SELECT 
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check profiles table structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('role', 'user_type', 'is_admin')
ORDER BY ordinal_position;

-- ============================================================================
-- TESTING
-- ============================================================================
-- After running this script:
-- 1. Sign up a new landlord at /auth/sign-up?type=landlord
-- 2. Check the profiles table:
--    SELECT id, email, role, user_type FROM profiles WHERE email = 'test-landlord@example.com';
-- 3. Expected result: role='landlord' AND user_type='landlord'
-- ============================================================================
