-- Script to help debug and fix profile issues for admin access
-- This will help resolve the empty {} error when adding properties

-- 1. First, check if auth users exist
SELECT id, email, created_at FROM auth.users;

-- 2. Check if profiles exist for users
SELECT id, email, is_admin, role FROM public.profiles;

-- 3. Find your specific user ID by email
SELECT id FROM auth.users WHERE email = 'sebenock027@gmail.com';

-- 4. If the profile doesn't exist, create it
-- Replace 'YOUR_USER_ID_HERE' with the ID from step 3
INSERT INTO public.profiles (id, email, is_admin, role, created_at, updated_at)
SELECT 
    id,
    email,
    true as is_admin,
    'admin' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users 
WHERE email = 'sebenock027@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    role = 'admin',
    updated_at = NOW();

-- 5. Verify the profile is created
SELECT id, email, is_admin, role FROM public.profiles WHERE email = 'sebenock027@gmail.com';