-- ============================================================================
-- DIAGNOSTIC: Check if properties exist and RLS is working
-- ============================================================================

-- 1. Check if properties table exists and has data
SELECT 
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE is_active = true) as active_properties
FROM public.properties;

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'properties';

-- 3. Check RLS policies on properties
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- 4. Check grants for anon role
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'properties'
AND grantee IN ('authenticated', 'anon');

-- 5. Try to fetch a sample property as would happen from the app
-- (This simulates what the anonymous client would do)
SELECT 
  id,
  title,
  location,
  price_ugx,
  image_url,
  category,
  bedrooms,
  bathrooms
FROM public.properties
WHERE is_active = true
LIMIT 5;
