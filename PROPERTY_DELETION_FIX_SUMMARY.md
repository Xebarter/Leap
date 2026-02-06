# Property Deletion Storage Cleanup Fix

## Issues Discovered and Fixed

### Issue 1: Images Not Showing on Property Details Page
**Problem**: Images for apartment, office, and hostel properties were not displaying on the public property details page.

**Root Cause**: In `components/adminView/property-manager/apartment-edit-service.ts`, the code was trying to read `img.category` from the database, but the actual column name is `area`.

**Fix**: Changed line 196 from:
```typescript
category: img.category || 'general',
```
to:
```typescript
category: img.area || 'general',
```

**Location**: `components/adminView/property-manager/apartment-edit-service.ts:196`

---

### Issue 2: Orphaned Images After Property Deletion
**Problem**: When deleting properties from the admin dashboard, image records were removed from the database (thanks to CASCADE constraint), but the actual image files remained in the Supabase storage bucket, wasting storage space.

**Root Cause**: The DELETE endpoint in `app/api/properties/route.ts` only deleted the property record from the database. While the `ON DELETE CASCADE` constraint automatically removed related `property_images` records, the physical files in the storage bucket were never deleted.

**Fix**: Enhanced the DELETE handler to:
1. Fetch the property's main image URL
2. Fetch all associated property_images
3. Extract storage paths from URLs
4. Delete all image files from the `property-images` storage bucket
5. Then delete the property (CASCADE handles database cleanup)

**Location**: `app/api/properties/route.ts` (DELETE handler, lines 1063-1118)

---

## How It Works Now

### When a Property is Deleted:

1. **Fetch Property Data**: Gets the main property image URL
2. **Fetch Associated Images**: Gets all images from `property_images` table
3. **Extract Storage Paths**: 
   - Uses `image_storage_path` if available
   - Falls back to extracting path from `image_url` 
   - URL format: `https://{project}.supabase.co/storage/v1/object/public/property-images/{path}`
4. **Delete from Storage**: Removes all image files from the `property-images` bucket
5. **Delete from Database**: Deletes the property record (CASCADE automatically removes related records)

### Database Schema

The `property_images` table has a CASCADE constraint:
```sql
property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL
```

This means when a property is deleted, all its `property_images` records are automatically removed from the database.

---

## Cleanup Script

A new SQL script has been created to help identify and clean up any existing orphaned images: `scripts/CLEANUP_ORPHANED_IMAGES.sql`

### What It Does:
1. **Identifies orphaned images**: Finds `property_images` records that reference non-existent properties
2. **Shows statistics**: Displays image counts per property
3. **Finds duplicates**: Identifies images used by multiple properties
4. **Provides cleanup function**: Includes a SQL function to remove orphaned records
5. **Verifies CASCADE constraint**: Checks if the foreign key constraint is properly configured

### How to Use:
```sql
-- 1. Check for orphaned images
SELECT COUNT(*) FROM property_images pi
LEFT JOIN properties p ON p.id = pi.property_id
WHERE p.id IS NULL;

-- 2. Clean up orphaned records (uncomment to execute)
-- DELETE FROM property_images 
-- WHERE property_id NOT IN (SELECT id FROM properties);

-- 3. Or use the provided function
SELECT * FROM cleanup_orphaned_property_images();
```

---

## Storage Buckets

The application uses the following storage buckets:
- **property-images**: Main bucket for all property images
- **tenant-documents**: For tenant-uploaded documents (has proper cleanup)

Both buckets should have RLS policies configured properly.

---

## Testing

### To Test the Fix:

1. **Test Image Display**:
   - Create an apartment/office/hostel property with multiple images
   - Visit the property details page: `/properties/{id}`
   - Verify all images display correctly in the gallery

2. **Test Property Deletion**:
   - Create a test property with images
   - Note the image URLs
   - Delete the property from admin dashboard
   - Check Supabase Storage > property-images bucket
   - Verify the image files are deleted
   - Check `property_images` table
   - Verify database records are removed

3. **Test Cleanup Script**:
   - Run `scripts/CLEANUP_ORPHANED_IMAGES.sql` in Supabase SQL Editor
   - Review the output for any orphaned images
   - If found, clean them up using the provided function

---

## Migration Notes

### For Existing Deployments:

1. **Deploy the code fixes** (both issue fixes are included)
2. **Run the cleanup script** to remove existing orphaned images:
   ```sql
   SELECT * FROM cleanup_orphaned_property_images();
   ```
3. **Manually clean storage** (if needed):
   - Go to Supabase Dashboard > Storage > property-images
   - Compare files with database records
   - Delete any orphaned files

### Storage Considerations:

- The fix only handles **future deletions**
- **Existing orphaned files** must be cleaned up manually or via the SQL script
- Consider setting up storage bucket lifecycle policies in Supabase for automatic cleanup

---

## Related Files Modified

1. `components/adminView/property-manager/apartment-edit-service.ts` - Fixed image category field
2. `app/api/properties/route.ts` - Added storage cleanup on property deletion
3. `scripts/CLEANUP_ORPHANED_IMAGES.sql` - New cleanup utility script

---

## Future Improvements

Consider implementing:
1. **Scheduled cleanup job**: Periodic check for orphaned files
2. **Storage audit endpoint**: API to compare database records with storage files
3. **Soft deletes**: Mark properties as deleted instead of hard delete
4. **Image versioning**: Keep previous versions of updated images
5. **CDN integration**: Use CDN for better image delivery performance
