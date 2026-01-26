-- ============================================================================
-- ADD UNIQUE 10-DIGIT TENANT NUMBER TO TENANT PROFILES
-- ============================================================================
-- This script adds a tenant_number column and automatically generates
-- unique 10-digit numbers for all tenants
-- ============================================================================

-- Step 1: Add tenant_number column to tenant_profiles table
ALTER TABLE public.tenant_profiles 
ADD COLUMN IF NOT EXISTS tenant_number TEXT UNIQUE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant_number 
ON public.tenant_profiles(tenant_number);

-- Step 3: Create function to generate unique 10-digit tenant number
CREATE OR REPLACE FUNCTION public.generate_tenant_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 10-digit number starting with non-zero
    new_number := LPAD(FLOOR(1000000000 + RANDOM() * 9000000000)::TEXT, 10, '0');
    
    -- Check if this number already exists
    SELECT EXISTS(
      SELECT 1 FROM public.tenant_profiles 
      WHERE tenant_number = new_number
    ) INTO number_exists;
    
    -- If number doesn't exist, we can use it
    EXIT WHEN NOT number_exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger function to assign tenant number on insert
CREATE OR REPLACE FUNCTION public.assign_tenant_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if tenant_number is not already set
  IF NEW.tenant_number IS NULL THEN
    NEW.tenant_number := public.generate_tenant_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_assign_tenant_number ON public.tenant_profiles;

-- Step 6: Create trigger to auto-assign tenant number
CREATE TRIGGER trigger_assign_tenant_number
  BEFORE INSERT ON public.tenant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_tenant_number();

-- Step 7: Assign tenant numbers to existing profiles that don't have one
UPDATE public.tenant_profiles 
SET tenant_number = public.generate_tenant_number()
WHERE tenant_number IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  'Column exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tenant_profiles' 
    AND column_name = 'tenant_number'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'Index exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_indexes 
    WHERE indexname = 'idx_tenant_profiles_tenant_number'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'Trigger exists' as check_item,
  CASE WHEN EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'trigger_assign_tenant_number'
  ) THEN '✓ YES' ELSE '✗ NO' END as status
UNION ALL
SELECT 
  'All profiles have tenant numbers' as check_item,
  CASE WHEN NOT EXISTS (
    SELECT FROM public.tenant_profiles 
    WHERE tenant_number IS NULL
  ) THEN '✓ YES' ELSE '✗ NO' END as status;

-- Show sample tenant numbers
SELECT 
  user_id,
  tenant_number,
  created_at
FROM public.tenant_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Tenant numbers are exactly 10 digits long
-- 2. They start with 1-9 (not 0) to ensure full 10 digits
-- 3. Each number is unique and automatically assigned
-- 4. Existing tenant profiles will be updated with numbers
-- 5. New tenants get a number automatically on profile creation
-- ============================================================================
