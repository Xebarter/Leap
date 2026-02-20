-- ============================================================================
-- AUTO-CREATE LANDLORD PROFILE ON SIGNUP
-- ============================================================================
-- This script creates a trigger that automatically creates a landlord_profiles
-- entry when a user signs up with role='landlord' or user_type='landlord'
-- ============================================================================

-- ============================================================================
-- 1. CREATE FUNCTION TO AUTO-CREATE LANDLORD PROFILE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_landlord_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new profile is a landlord
  IF NEW.role = 'landlord' OR NEW.user_type = 'landlord' THEN
    -- Create a landlord_profile entry for this user
    INSERT INTO public.landlord_profiles (
      user_id,
      status,
      verification_status
    )
    VALUES (
      NEW.id,
      'pending',  -- Default status
      'unverified'  -- Default verification status
    )
    ON CONFLICT (user_id) DO NOTHING;  -- Prevent duplicates
    
    RAISE NOTICE 'Created landlord_profile for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE TRIGGER ON PROFILES TABLE
-- ============================================================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_landlord_profile_trigger ON public.profiles;

-- Create the trigger to fire AFTER INSERT on profiles
CREATE TRIGGER create_landlord_profile_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_landlord_profile_on_signup();

-- ============================================================================
-- 3. ALSO ADD POLICY TO ALLOW LANDLORD PROFILE CREATION DURING SIGNUP
-- ============================================================================
-- This ensures the trigger can insert into landlord_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'landlord_profiles' 
        AND policyname = 'Allow system to create landlord profiles on signup'
    ) THEN
        CREATE POLICY "Allow system to create landlord profiles on signup" 
        ON public.landlord_profiles
        FOR INSERT 
        WITH CHECK (true);  -- Allow system-level inserts
    END IF;
END $$;

-- ============================================================================
-- 4. FIX EXISTING LANDLORDS WHO DON'T HAVE LANDLORD_PROFILES
-- ============================================================================
-- Find landlords in profiles table who don't have a landlord_profiles entry
INSERT INTO public.landlord_profiles (user_id, status, verification_status)
SELECT 
  p.id,
  'pending',
  'unverified'
FROM public.profiles p
LEFT JOIN public.landlord_profiles lp ON p.id = lp.user_id
WHERE (p.role = 'landlord' OR p.user_type = 'landlord')
  AND lp.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 5. VERIFY THE SETUP
-- ============================================================================
-- Check if function exists
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'create_landlord_profile_on_signup';

-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'create_landlord_profile_trigger';

-- Check landlord profiles
SELECT 
  p.email,
  p.role,
  p.user_type,
  lp.id as landlord_profile_id,
  lp.status,
  lp.verification_status
FROM public.profiles p
LEFT JOIN public.landlord_profiles lp ON p.id = lp.user_id
WHERE p.role = 'landlord' OR p.user_type = 'landlord';

-- ============================================================================
-- TESTING INSTRUCTIONS
-- ============================================================================
-- After running this script:
-- 1. Sign up a new landlord at /auth/sign-up?type=landlord
-- 2. Verify the landlord_profiles entry was created:
--    SELECT * FROM landlord_profiles WHERE user_id = (
--      SELECT id FROM profiles WHERE email = 'new-landlord@example.com'
--    );
-- 3. Check that they appear on /admin/landlords page
-- ============================================================================

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. This trigger runs AFTER a profile is created
-- 2. It automatically creates a landlord_profiles entry for landlords
-- 3. Existing landlords are backfilled with the INSERT statement
-- 4. The trigger is idempotent (safe to run multiple times)
-- ============================================================================
