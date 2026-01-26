# Quick Fix for "Failed to create tenant profile" Error

## Most Common Issues and Solutions

### Issue 1: Table Doesn't Exist (Most Likely)
**Error Code**: `42P01` or `relation "public.tenant_profiles" does not exist`

**Solution**: Run this in Supabase SQL Editor:
```sql
-- Run the entire file:
scripts/TENANTS_SCHEMA.sql
```

---

### Issue 2: No INSERT Permission
**Error Code**: `42501` or `permission denied`

**Solution**: Run this in Supabase SQL Editor:
```sql
-- Run the entire file:
scripts/FIX_TENANT_PROFILE_INSERT_POLICY.sql
```

---

### Issue 3: Missing Required Field
**Error Code**: `23502` or `null value in column`

**Solution**: The database requires a field that we're not sending. Check the error details to see which field.

---

### Issue 4: Duplicate Entry (Less Likely)
**Error Code**: `23505` or `duplicate key value`

**Already Fixed**: The code handles this by using UPDATE instead of INSERT when profile exists.

---

## Quick Test

Run this in Supabase SQL Editor to check if the table exists:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tenant_profiles'
) as table_exists;

-- If FALSE, run scripts/TENANTS_SCHEMA.sql
-- If TRUE, check permissions next

-- Check INSERT policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'tenant_profiles' 
AND cmd = 'INSERT';

-- Should show at least one INSERT policy
-- If empty, run scripts/FIX_TENANT_PROFILE_INSERT_POLICY.sql
```

---

## What to Share

To help me fix this faster, please share:

1. **From Browser Console (F12 → Console tab)**:
   - The full error object (expand it and copy)
   
2. **From Server Terminal** (where `npm run dev` runs):
   - The logged error with code, details, hint

3. **From Supabase SQL Editor** (run the test above):
   - Does table exist? (TRUE/FALSE)
   - Any INSERT policies? (list them)

---

## Emergency Fix

If you just want it to work RIGHT NOW without debugging:

1. Go to Supabase Dashboard → SQL Editor
2. Run **ALL** of these in order:
   ```sql
   -- 1. Create table
   -- Copy entire content of: scripts/TENANTS_SCHEMA.sql
   
   -- 2. Fix permissions
   -- Copy entire content of: scripts/FIX_TENANT_PROFILE_INSERT_POLICY.sql
   ```
3. Try saving profile again

This should fix 95% of cases!
