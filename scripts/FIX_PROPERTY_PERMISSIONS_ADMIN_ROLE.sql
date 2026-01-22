-- Script to fix permissions and grant admin role for property management
-- This ensures that admin users can perform CRUD operations on properties via the admin dashboard

-- 1. First, check if the user exists and has admin role
-- If not, grant admin role to the specific user (replace 'your-email@example.com' with actual email)
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE email = 'sebenock027@gmail.com';  -- Replace with your admin email

-- 2. Ensure authenticated users have proper permissions to the tables
GRANT ALL PRIVILEGES ON TABLE public.properties TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.property_blocks TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.property_units TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.property_images TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.property_details TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.property_detail_images TO authenticated;

-- 3. Grant usage and select permissions on sequences for inserts to work
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Ensure the RLS policies are correctly set for admin access
-- First drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage property blocks" ON public.property_blocks;
DROP POLICY IF EXISTS "Admins can manage property units" ON public.property_units;
DROP POLICY IF EXISTS "Admins can manage property images" ON public.property_images;
DROP POLICY IF EXISTS "Admins can manage property details" ON public.property_details;
DROP POLICY IF EXISTS "Admins can manage property detail images" ON public.property_detail_images;

-- Recreate policies allowing admins to manage everything
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage property blocks" ON public.property_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage property units" ON public.property_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage property images" ON public.property_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage property details" ON public.property_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage property detail images" ON public.property_detail_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 5. If you want to temporarily disable RLS for development/testing
-- NOTE: Don't run this in production!
-- ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_blocks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_units DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_images DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_details DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_detail_images DISABLE ROW LEVEL SECURITY;

-- 6. Finally, check that the service_role can still perform operations
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;