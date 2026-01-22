-- ============================================================================
-- FIX: Property Blocks RLS Policies
-- ============================================================================
-- Issue: Property hosts cannot manage their own blocks because the RLS policy
-- only allows admins to manage blocks. This causes property creation to fail
-- when trying to refresh data after creating units.
-- 
-- Solution: Update the RLS policy to also allow property hosts to manage blocks
-- that contain their properties.
-- ============================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can manage property blocks" ON public.property_blocks;

-- Create a new policy that allows both admins and property hosts to manage blocks
CREATE POLICY "Admins and property hosts can manage property blocks" ON public.property_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.block_id = property_blocks.id AND p.host_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- This query verifies the policy is working correctly:
-- SELECT pb.id, pb.name, COUNT(p.id) as property_count
-- FROM public.property_blocks pb
-- LEFT JOIN public.properties p ON p.block_id = pb.id
-- GROUP BY pb.id, pb.name;
-- ============================================================================
