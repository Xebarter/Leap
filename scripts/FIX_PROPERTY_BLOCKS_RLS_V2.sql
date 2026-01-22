-- ============================================================================
-- FIX: Property Blocks RLS Policies V2
-- ============================================================================
-- Issue: Property hosts cannot CREATE new blocks because:
-- 1. The original policy only allows admins
-- 2. The V1 fix checks for existing properties with the block_id, but new 
--    blocks have no properties yet (catch-22)
-- 
-- Solution: Allow authenticated users to INSERT blocks (they create them),
-- but restrict UPDATE/DELETE to admins and property hosts who own properties
-- in that block.
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Admins and property hosts can manage property blocks" ON public.property_blocks;

-- Allow authenticated users to create new blocks
CREATE POLICY "Authenticated users can create property blocks" ON public.property_blocks
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins and property hosts to update/delete their blocks
CREATE POLICY "Admins and property hosts can update/delete property blocks" ON public.property_blocks
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.block_id = property_blocks.id AND p.host_id = auth.uid()
    )
    OR
    created_by = auth.uid()
  );

CREATE POLICY "Admins and property hosts can delete property blocks" ON public.property_blocks
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.block_id = property_blocks.id AND p.host_id = auth.uid()
    )
    OR
    created_by = auth.uid()
  );

-- Keep the existing SELECT policy (everyone can view)
-- This should already exist, but we'll ensure it's there
DROP POLICY IF EXISTS "Property blocks are viewable by everyone" ON public.property_blocks;
CREATE POLICY "Property blocks are viewable by everyone" ON public.property_blocks
  FOR SELECT USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Ensure authenticated users have INSERT permission
GRANT INSERT ON public.property_blocks TO authenticated;
GRANT UPDATE ON public.property_blocks TO authenticated;
GRANT DELETE ON public.property_blocks TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, test by:
-- 1. Login as a non-admin user
-- 2. Try to create a property - it should work now
-- 3. Check that blocks are created successfully
-- ============================================================================
