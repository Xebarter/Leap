-- Run this in Supabase SQL Editor to verify everything is set up

-- 1. Check if tables exist
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename IN ('property_views', 'property_interested');

-- 2. Check table structures
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'property_views'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'property_interested'
ORDER BY ordinal_position;

-- 3. Check if columns added to properties table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name IN ('daily_views_count', 'total_views_count', 'interested_count');

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('property_views', 'property_interested');

-- 5. Try a test insert (this will tell us if permissions work)
DO $$
DECLARE
  test_property_id UUID;
BEGIN
  -- Get a real property ID
  SELECT id INTO test_property_id FROM properties LIMIT 1;
  
  -- Try to insert a test view
  INSERT INTO property_views (property_id, session_id)
  VALUES (test_property_id, 'test-session-' || NOW()::text);
  
  RAISE NOTICE 'Test insert successful! Tables are working.';
  
  -- Clean up test data
  DELETE FROM property_views WHERE session_id LIKE 'test-session-%';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;
