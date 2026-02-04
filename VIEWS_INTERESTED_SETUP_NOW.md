# 🚨 SETUP REQUIRED - Run This Now

## The Issue
The API endpoints are failing because the database tables don't exist yet.

## ✅ Solution: Run SQL Script

### Step 1: Open Supabase
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script
Copy and paste **ONE** of these scripts:

#### Option A: Minimal Script (Recommended)
```sql
-- File: scripts/ADD_PROPERTY_VIEWS_INTERESTED_MINIMAL.sql
-- Copy the entire contents of this file and paste into SQL Editor
-- Then click "Run"
```

#### Option B: Full Script
```sql
-- File: scripts/ADD_PROPERTY_VIEWS_INTERESTED.sql
-- Copy the entire contents of this file and paste into SQL Editor
-- Then click "Run"
```

### Step 3: Verify Tables Created
After running the script, run this to verify:
```sql
-- Check if tables exist
SELECT 'property_views' as table_name, COUNT(*) as count FROM property_views
UNION ALL
SELECT 'property_interested', COUNT(*) FROM property_interested;

-- Check if columns added to properties
SELECT 
  daily_views_count, 
  total_views_count, 
  interested_count 
FROM properties 
LIMIT 1;
```

You should see:
- ✅ Both tables return 0 (empty but exist)
- ✅ Properties table has the new columns

### Step 4: Test Again
1. Refresh your property details page
2. Click "I'm Interested" button
3. It should work now! ✅

---

## If You Get Errors

### Error: "relation does not exist"
**Solution:** The tables weren't created. Run the SQL script again.

### Error: "policy already exists"
**Solution:** Use the MINIMAL script which handles this automatically.

### Error: "column does not exist"
**Solution:** The columns weren't added to properties table. Run:
```sql
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS daily_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interested_count INTEGER DEFAULT 0;
```

---

## Quick Test After Setup

```sql
-- Test insert into property_views
INSERT INTO property_views (property_id, session_id) 
VALUES ('0df429ec-b348-486b-a49d-e347f79f80bf', 'test-session');

-- Check if it worked
SELECT COUNT(*) FROM property_views;

-- Check if trigger updated the count
SELECT daily_views_count, total_views_count 
FROM properties 
WHERE id = '0df429ec-b348-486b-a49d-e347f79f80bf';
```

If this works, your feature is ready! 🎉

---

**Bottom Line:** Run the SQL script first, then everything will work!
