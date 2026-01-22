-- ============================================================================
-- DIAGNOSE: Check Current User and Permissions
-- ============================================================================
-- Run this to see what's wrong with your current setup
-- ============================================================================

-- 1. Check your current user
SELECT 
    auth.uid() as "Your User ID",
    auth.email() as "Your Email";

-- 2. Check your profile
SELECT id, email, is_admin, user_type, created_at
FROM public.profiles
WHERE id = auth.uid();

-- 3. Check if property_blocks table exists and has RLS enabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'property_blocks';

-- 4. Check all policies on property_blocks
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as "Command (INSERT/UPDATE/DELETE/SELECT)",
    roles as "Roles",
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as "USING Status",
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as "WITH CHECK Status"
FROM pg_policies 
WHERE tablename = 'property_blocks'
ORDER BY cmd;

-- 5. Check grants on property_blocks
SELECT 
    grantee as "Who Can Access",
    privilege_type as "Permission Type"
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'property_blocks'
AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- 6. Check if created_by column exists in property_blocks
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'property_blocks'
ORDER BY ordinal_position;
