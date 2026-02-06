-- ============================================================================
-- CLEANUP ORPHANED PROPERTY IMAGES
-- ============================================================================
-- This script identifies and helps clean up orphaned property images
-- (images in the database that reference deleted properties)
-- 
-- WARNING: This script only handles database records. Storage files must be
-- cleaned up manually or through the application code.
-- ============================================================================

-- 1. Check for orphaned property_images (images without a property)
SELECT 
    COUNT(*) as orphaned_images_count,
    'These images reference properties that no longer exist' as description
FROM property_images pi
LEFT JOIN properties p ON p.id = pi.property_id
WHERE p.id IS NULL;

-- 2. View details of orphaned images
SELECT 
    pi.id,
    pi.property_id as missing_property_id,
    pi.image_url,
    pi.image_storage_path,
    pi.area,
    pi.created_at
FROM property_images pi
LEFT JOIN properties p ON p.id = pi.property_id
WHERE p.id IS NULL
ORDER BY pi.created_at DESC;

-- 3. Delete orphaned property_images from database
-- UNCOMMENT THE FOLLOWING LINE TO DELETE ORPHANED RECORDS:
-- DELETE FROM property_images 
-- WHERE property_id NOT IN (SELECT id FROM properties);

-- 4. Check for property_images statistics
SELECT 
    COUNT(DISTINCT pi.property_id) as properties_with_images,
    COUNT(*) as total_images,
    AVG(images_per_property) as avg_images_per_property
FROM (
    SELECT 
        property_id,
        COUNT(*) as images_per_property
    FROM property_images
    GROUP BY property_id
) as subquery
CROSS JOIN property_images pi;

-- 5. List properties with their image counts
SELECT 
    p.id,
    p.title,
    p.category,
    p.is_active,
    COUNT(pi.id) as image_count
FROM properties p
LEFT JOIN property_images pi ON pi.property_id = p.id
GROUP BY p.id, p.title, p.category, p.is_active
ORDER BY image_count DESC;

-- 6. Find duplicate images (same URL used multiple times)
SELECT 
    image_url,
    COUNT(*) as usage_count,
    array_agg(DISTINCT property_id) as property_ids
FROM property_images
GROUP BY image_url
HAVING COUNT(*) > 1;

-- ============================================================================
-- MANUAL STORAGE CLEANUP INSTRUCTIONS
-- ============================================================================
-- To clean up orphaned files from Supabase storage:
-- 
-- 1. Run the query in step 2 above to get the list of orphaned images
-- 2. For each image_url or image_storage_path, manually delete from storage
-- 3. Or use the Supabase dashboard: Storage > property-images > Delete files
-- 4. Then run the DELETE query in step 3 to clean up database records
-- 
-- NOTE: The application now automatically cleans up storage files when
-- properties are deleted through the admin dashboard.
-- ============================================================================

-- 7. Add a database function to automatically clean orphaned images (optional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_property_images()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete property_images where the property no longer exists
    DELETE FROM property_images 
    WHERE property_id NOT IN (SELECT id FROM properties);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run the cleanup function:
-- SELECT * FROM cleanup_orphaned_property_images();

-- 8. Check if CASCADE constraint is properly set
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'property_images'
    AND ccu.table_name = 'properties';
