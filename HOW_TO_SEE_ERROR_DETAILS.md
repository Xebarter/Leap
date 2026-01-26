# How to See the Full Error Message

## Method 1: Browser Console (Recommended)

1. **Open DevTools**: Press `F12` (or `Ctrl+Shift+I` on Windows/Linux, `Cmd+Option+I` on Mac)
2. **Go to Console tab**
3. **Try to save your profile**
4. **Look for red error messages** that look like:
   ```
   ❌ API Error Response: {error: "...", details: "...", code: "..."}
   Status: 500
   Details: [THE ACTUAL ERROR MESSAGE]
   Code: [ERROR CODE]
   Hint: [SUGGESTION]
   ```
5. **Expand the error object** by clicking the arrow
6. **Copy the entire message** and send it to me

## Method 2: Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to save your profile
4. Click on the `/api/profile` request
5. Go to **Response** tab
6. Copy the JSON response and send it

## Method 3: Server Logs

Look at your terminal where `npm run dev` is running. You should see:
```
Tenant profile creation error: {
  message: "...",
  code: "...",
  details: "...",
  hint: "...",
  user_id: "..."
}
```

Copy that entire block.

---

# Quick Fix (Skip Debugging)

If you just want it fixed, run this in Supabase SQL Editor:

```sql
-- Quick fix for tenant profile
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
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

DROP POLICY IF EXISTS "Tenants can insert their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can view their own profile" ON public.tenant_profiles;
DROP POLICY IF EXISTS "Tenants can update their own profile" ON public.tenant_profiles;

CREATE POLICY "Tenants can insert their own profile" ON public.tenant_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can view their own profile" ON public.tenant_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenants can update their own profile" ON public.tenant_profiles
  FOR UPDATE USING (auth.uid() = user_id);

GRANT ALL ON public.tenant_profiles TO authenticated;
```

Then try again!
