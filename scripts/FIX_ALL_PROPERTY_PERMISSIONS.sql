-- ============================================================================
-- COMPREHENSIVE FIX: All Property-Related Permissions
-- ============================================================================
-- This script ensures all necessary permissions and RLS policies are in place
-- for property creation, block management, and unit creation.
-- ============================================================================

-- ============================================================================
-- 1. PROPERTY BLOCKS - Allow authenticated users to create blocks
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Admins and property hosts can manage property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Authenticated users can create property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Admins and property hosts can update/delete property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Admins and property hosts can delete property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Property blocks are viewable by everyone" ON public.property_blocks;

-- Create new policies
CREATE POLICY "Property blocks are viewable by everyone" ON public.property_blocks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create property blocks" ON public.property_blocks
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and property hosts can update property blocks" ON public.property_blocks
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.block_id = property_blocks.id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Admins and property hosts can delete property blocks" ON public.property_blocks
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.block_id = property_blocks.id AND p.host_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.property_blocks TO authenticated, anon;
GRANT INSERT ON public.property_blocks TO authenticated;
GRANT UPDATE ON public.property_blocks TO authenticated;
GRANT DELETE ON public.property_blocks TO authenticated;

-- ============================================================================
-- 2. PROPERTIES - Ensure proper insert permissions
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert properties if they are admins or landlords" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;

-- Recreate with proper permissions
CREATE POLICY "Authenticated users can insert properties" ON public.properties
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND (is_admin = true OR user_type IN ('landlord', 'admin'))
      )
      OR host_id = auth.uid()
    )
  );

-- Grant permissions
GRANT INSERT ON public.properties TO authenticated;
GRANT UPDATE ON public.properties TO authenticated;

-- ============================================================================
-- 3. PROPERTY UNITS - Allow creation by property hosts
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Property hosts and admins can manage units" ON public.property_units;

-- Recreate with proper permissions
CREATE POLICY "Property hosts and admins can insert units" ON public.property_units
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_units.property_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Property hosts and admins can update units" ON public.property_units
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_units.property_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Property hosts and admins can delete units" ON public.property_units
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_units.property_id AND p.host_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.property_units TO authenticated, anon;
GRANT INSERT ON public.property_units TO authenticated;
GRANT UPDATE ON public.property_units TO authenticated;
GRANT DELETE ON public.property_units TO authenticated;

-- ============================================================================
-- 4. PROFILES - Ensure profile access works correctly
-- ============================================================================

-- Ensure the profiles table has proper grants
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT UPDATE ON public.profiles TO authenticated;

-- ============================================================================
-- 5. VERIFY SEQUENCES (for auto-increment IDs)
-- ============================================================================

-- Grant usage on sequences if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename LIKE '%property%') THEN
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the setup:
/*
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('property_blocks', 'properties', 'property_units');

-- Check policies
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename IN ('property_blocks', 'properties', 'property_units')
ORDER BY tablename, cmd;

-- Check grants
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name IN ('property_blocks', 'properties', 'property_units')
AND grantee IN ('authenticated', 'anon');
*/

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this script:
-- 1. Refresh your browser
-- 2. Try creating a property again
-- 3. Check the console for detailed error messages if it still fails
-- ============================================================================
