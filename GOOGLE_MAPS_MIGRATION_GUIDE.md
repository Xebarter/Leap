# Google Maps Field Migration Guide

## Issue
If you're seeing the error "Database error: The google_maps_embed_url column may not exist" when trying to save a property, you need to run the database migration to add the Google Maps field.

## Solution

### Step 1: Access Your Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project from the dashboard
3. Click on the **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click the **+ New Query** button (or New SQL Query)
2. Copy the entire contents of the migration file below:

```sql
-- ============================================================================
-- Add Google Maps embed URL field to properties table
-- ============================================================================

-- Add the google_maps_embed_url column to properties table
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.properties.google_maps_embed_url IS 'Google Maps embed URL - users can paste the full Google Maps link or embed code';

-- Create an index for filtering by maps URL presence
CREATE INDEX IF NOT EXISTS idx_properties_has_maps ON public.properties(google_maps_embed_url) 
WHERE google_maps_embed_url IS NOT NULL;
```

3. Paste this into your SQL Query editor
4. Click the **Run** button (or press Ctrl+Enter)
5. You should see a success message

### Step 3: Verify the Migration
After running the migration, you should see:
- ✅ "0 rows affected" (this is normal for ALTER TABLE)
- The query should complete without errors

### Step 4: Try Saving Again
1. Go back to your property editor
2. Try saving the property again
3. The Google Maps URL field should now save successfully

## Alternative: If Using a Local PostgreSQL Database

If you're using a local PostgreSQL database instead of Supabase:

```bash
# Connect to your database
psql -U your_user -d your_database -h localhost

# Then paste and run the SQL commands above
```

## Troubleshooting

### Error: "permission denied for schema public"
- You may need to run the migration with a user that has ALTER TABLE permissions
- Contact your database administrator

### Error: "relation 'properties' does not exist"
- The properties table hasn't been created yet
- Run the complete properties schema setup first

### Column already exists
- This is fine! The migration uses `IF NOT EXISTS` so it won't error
- The column is already in your database

## What This Migration Does

1. **Adds `google_maps_embed_url` column** - Stores the Google Maps link provided during property creation/editing
2. **Adds a comment** - Documents what the column is for
3. **Creates an index** - Optimizes queries filtering by whether a maps URL exists

## How to Use the Google Maps Feature

### In the Admin Editor
1. Go to **Properties** → Edit a property → **Location** section
2. Paste your Google Maps share link in the "Google Maps Link" field
3. Click **Save**

### Getting a Google Maps Link
1. Open [Google Maps](https://maps.google.com)
2. Search for your property address
3. Click the **Share** button
4. Click **Copy link**
5. Paste into the property editor's Location section

### On the Public Property Page
- The Google Maps location will display with an interactive map
- Users can zoom, pan, and explore the property location
- The address is displayed below the map

## Support

If you continue to experience issues:
1. Check the browser console for detailed error messages (F12 → Console)
2. Verify the migration ran successfully in Supabase
3. Try refreshing the page after running the migration
4. Check that your Supabase user has the necessary permissions

