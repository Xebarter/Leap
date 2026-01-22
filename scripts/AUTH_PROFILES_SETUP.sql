-- ============================================================================
-- AUTHENTICATION AND PROFILES SETUP
-- ============================================================================
-- This script ensures proper profile creation when users sign up
-- Works with both email/password and OAuth (Google, etc.)
-- ============================================================================

-- ============================================================================
-- 1. ENSURE PROFILES TABLE HAS user_type COLUMN
-- ============================================================================
-- Add user_type column if it doesn't exist (in addition to role)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='user_type') THEN
        ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'tenant';
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE OR REPLACE FUNCTION TO HANDLE NEW USER SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
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
-- 3. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ============================================================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. ADD POLICY FOR PROFILE INSERTION (if not exists)
-- ============================================================================
-- Allow profile creation during signup
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Enable insert for authenticated users during signup'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users during signup" 
        ON public.profiles
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- ============================================================================
-- 5. ENSURE ADMIN USER EXISTS (OPTIONAL - FOR TESTING)
-- ============================================================================
-- Uncomment and modify this section to create a test admin user
-- NOTE: You should create admin users through Supabase Auth UI instead

/*
-- First, you need to create the user in Supabase Auth UI, then run this:
UPDATE public.profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'your-admin-email@example.com';
*/

-- ============================================================================
-- 6. VERIFY SETUP
-- ============================================================================
-- Run these queries to verify the setup:

-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check profiles table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This trigger automatically creates a profile when a user signs up
-- 2. Works with email/password, Google OAuth, and other auth methods
-- 3. The is_admin flag can be set during signup (for development)
-- 4. In production, restrict admin creation through application logic
-- 5. The user_metadata from Supabase Auth is used to populate profile fields
-- ============================================================================
