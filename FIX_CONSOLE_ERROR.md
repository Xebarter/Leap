# Fix: Console Error "Error fetching properties from Supabase: {}"

## Problem
You're seeing an error in the console: **"Error fetching properties from Supabase: {}"**

This happens because the Google Maps feature requires a new database column `google_maps_embed_url` that doesn't exist yet.

## Solution

### ✅ Quick Fix (Temporary - Already Applied)
The code now has fallback logic:
- If the query fails due to missing `google_maps_embed_url`, it retries without that field
- Properties will display correctly even without the migration
- Google Maps links won't display until you run the migration

### 🔧 Permanent Fix (Required for Full Feature)

You need to apply the database migration to add the `google_maps_embed_url` column.

#### Option 1: Using Supabase Dashboard (Easiest)
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the migration:
```sql
-- Add Google Maps embed URL field to properties table
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.properties.google_maps_embed_url IS 'Google Maps embed URL - users can paste the full Google Maps link or embed code';

-- Create an index for filtering by maps URL presence
CREATE INDEX IF NOT EXISTS idx_properties_has_maps ON public.properties(google_maps_embed_url) 
WHERE google_maps_embed_url IS NOT NULL;
```
5. Click **Run**
6. Refresh your browser

#### Option 2: Using Command Line
```bash
psql -f scripts/ADD_GOOGLE_MAPS_FIELD.sql
```

#### Option 3: Using DBeaver or Similar Tool
1. Connect to your Supabase database
2. Run the SQL from `scripts/ADD_GOOGLE_MAPS_FIELD.sql`

## Verification

After applying the migration:

1. **Check the console** - error should be gone
2. **Create/Edit a property** - Google Maps link field should work
3. **View property details** - Maps should display if a link was added
4. **Check console** - Should see: `✅ Successfully fetched properties: X properties`

## What This Fixes

✅ Console error disappears
✅ Google Maps links can be saved
✅ Maps display on property details page
✅ No more "Error fetching properties" messages

## Current Status (Without Migration)

**Working**:
- ✅ Properties display correctly
- ✅ Property cards clickable
- ✅ Apartment editing works
- ✅ Everything else functions normally

**Not Working (Until Migration Applied)**:
- ❌ Google Maps link field appears but doesn't save
- ❌ Maps won't display (field is ignored)

## Why This Happened

The Google Maps feature was just added and requires a new database column. The code includes fallback logic so it works even without the migration, but the full feature requires the migration to be applied.

## Next Steps

1. **Apply the migration** using one of the three options above
2. **Refresh your browser**
3. **Test the feature**:
   - Create/edit a property
   - Add a Google Maps link
   - View the property and verify the map displays

---

**The console error is no longer blocking functionality, but apply the migration to enable the full Google Maps feature.**
