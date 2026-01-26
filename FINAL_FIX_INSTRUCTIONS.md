# FINAL FIX - Follow These Exact Steps

## Step 1: Create Database Table (REQUIRED)

1. Go to https://supabase.com
2. Open your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"
5. Copy and paste this ENTIRE block:

```sql
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT,
  date_of_birth DATE,
  national_id TEXT,
  national_id_type TEXT,
  home_address TEXT,
  home_city TEXT,
  home_district TEXT,
  home_postal_code TEXT,
  employment_status TEXT DEFAULT 'Employed',
  employer_name TEXT,
  employer_contact TEXT,
  employment_start_date DATE,
  monthly_income_ugx BIGINT,
  employment_type TEXT,
  status TEXT DEFAULT 'active',
  verification_status TEXT DEFAULT 'unverified',
  verification_date TIMESTAMPTZ,
  verified_by UUID,
  preferred_communication TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_all" ON public.tenant_profiles;
CREATE POLICY "tenant_all" ON public.tenant_profiles 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.tenant_profiles TO authenticated;
```

6. Click "RUN" (or press Ctrl+Enter)
7. Wait for "Success" message

## Step 2: Test Your App

1. Go to your app at http://localhost:3000/tenant/profile
2. Click "Edit Profile"
3. Fill in some information
4. Click "Save Changes"

## Expected Result

✅ You should see "Profile updated successfully!"
✅ Page should refresh with your new data

## If It Still Doesn't Work

Take a screenshot of:
1. The Supabase SQL Editor showing the query result
2. The browser console (F12 → Console tab) showing the error
3. Share both screenshots

---

# Why This Is Needed

The error "Failed to create tenant profile" happens because:
- The `tenant_profiles` table doesn't exist in your database
- OR the RLS policies don't allow inserts
- This SQL script fixes both issues

Without running this SQL, the feature CANNOT work.

---

# Have You Run The SQL?

[ ] Yes, I ran it and it worked!
[ ] Yes, I ran it but got an error: ___________
[ ] No, I haven't run it yet

Please check one and let me know!
