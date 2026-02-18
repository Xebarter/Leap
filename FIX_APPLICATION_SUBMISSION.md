# Fix Application Submission Error

## The Problem

When submitting a tenant application on the property details page, you get a **403 Forbidden** error:
```
permission denied for table users
```

## Root Cause

The RLS (Row Level Security) policies on the `tenant_applications` table were trying to access the `auth.users` table:

```sql
email = (SELECT email FROM auth.users WHERE id = auth.uid())
```

Regular users don't have permission to query the `auth.users` table, which caused the 403 error.

## The Solution

I've created a fixed version of the RLS policies in:
- **`scripts/FIX_TENANT_APPLICATIONS_RLS.sql`**

### What Changed

**Before (BROKEN):**
- Policies tried to check email by querying `auth.users`
- This caused permission denied errors

**After (FIXED):**
- Simplified policies to only check `applicant_id`
- Removed all references to `auth.users` table
- More secure: enforces that `applicant_id` must match `auth.uid()`

## How to Fix

### Step 1: Run the SQL Migration

Open your **Supabase SQL Editor** and run the contents of:
```
scripts/FIX_TENANT_APPLICATIONS_RLS.sql
```

This will:
1. ✅ Drop the old broken policies
2. ✅ Create new working policies
3. ✅ Verify the policies are created correctly

### Step 2: Test the Application Form

1. Go to any property details page
2. Click "Apply Now"
3. Fill in the application form
4. Upload required documents (National ID, Proof of Income)
5. Click "Submit Application"
6. ✅ Should succeed without 403 error!

## New RLS Policies

The fixed policies are:

1. **Users can view own applications**: Users can only see applications where they are the applicant
2. **Authenticated users can create applications**: Only logged-in users can create applications, and `applicant_id` must match their user ID
3. **Users can update own pending applications**: Users can only update their own pending applications
4. **Admins can view all applications**: Admins can see all applications
5. **Admins can update applications**: Admins can update any application
6. **Admins can delete applications**: Admins can delete applications

## Security Improvements

The new policies are actually **MORE secure** because:
- They enforce that `applicant_id` must equal `auth.uid()` on INSERT
- Users can't create applications for other users
- No reliance on email matching (which could be spoofed)

---

**After running the SQL, try submitting an application - it should work perfectly!** 🎉
