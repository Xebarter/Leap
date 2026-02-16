# Tenant & Landlord Authentication Implementation

## Overview
This document summarizes the complete implementation of tenant and landlord authentication flows in the Leap Property Management system.

## Changes Made

### 1. Sign-up Page (`app/auth/sign-up/page.tsx`)
- ✅ Added `userType` query parameter support (`?type=tenant` or `?type=landlord`)
- ✅ Dynamic page titles and descriptions based on user type
- ✅ Send `userType` to the signup API
- ✅ Redirect to correct dashboard based on user type after signup
- ✅ Added role-switching links (tenant ↔ landlord)
- ✅ Maintains existing admin signup functionality

### 2. Signup API (`app/api/auth/signup/route.ts`)
- ✅ Accept `userType` parameter from request
- ✅ Calculate correct `role` and `user_type` values
- ✅ Pass role and user_type to Supabase user metadata
- ✅ Enhanced logging for debugging
- ✅ Proper handling for admin, tenant, and landlord roles

### 3. Login Page (`app/auth/login/page.tsx`)
- ✅ Already had `userType` support via `?type=tenant` or `?type=landlord`
- ✅ Dynamic page titles and descriptions
- ✅ Role-based redirect after login
- ✅ Role-switching links already present

### 4. Auth Callback (`app/auth/callback/route.ts`)
- ✅ Enhanced to check both `role` and `user_type` fields
- ✅ Proper landlord detection
- ✅ Redirect to `/admin`, `/landlord`, or `/tenant` based on role

### 5. Schedule Visit Dialog (`components/publicView/schedule-visit-dialog.tsx`)
- ✅ Fixed accessibility issue by adding `DialogTitle` to all dialog states
- ✅ Used `VisuallyHidden` component for hidden titles
- ✅ Proper fragment wrapping for auth prompt and success states

## User Flows

### Tenant Sign-up & Sign-in

#### Sign-up URLs:
- `http://localhost:3000/auth/sign-up` (default - tenant)
- `http://localhost:3000/auth/sign-up?type=tenant` (explicit)

#### Sign-in URLs:
- `http://localhost:3000/auth/login` (default - tenant)
- `http://localhost:3000/auth/login?type=tenant` (explicit)

#### What Happens:
1. User fills out signup form
2. API creates user in Supabase Auth with metadata: `{ role: 'tenant', user_type: 'tenant' }`
3. Database trigger creates profile with `role='tenant'` and `user_type='tenant'`
4. User redirected to `/tenant` dashboard

---

### Landlord Sign-up & Sign-in

#### Sign-up URLs:
- `http://localhost:3000/auth/sign-up?type=landlord`

#### Sign-in URLs:
- `http://localhost:3000/auth/login?type=landlord`

#### What Happens:
1. User fills out signup form on landlord page
2. API creates user in Supabase Auth with metadata: `{ role: 'landlord', user_type: 'landlord' }`
3. Database trigger creates profile with `role='landlord'` and `user_type='landlord'`
4. User redirected to `/landlord` dashboard

---

### Admin Sign-up & Sign-in

#### Sign-up:
- `http://localhost:3000/auth/sign-up` + check "Register as Admin" checkbox

#### Sign-in:
- `http://localhost:3000/auth/login` (auto-detects admin role)

#### What Happens:
1. User checks "Register as Admin" checkbox
2. API creates user in Supabase Auth with metadata: `{ is_admin: true, role: 'admin', user_type: 'admin' }`
3. Database trigger creates profile with `role='admin'`, `user_type='admin'`, and `is_admin=true`
4. User redirected to `/admin` dashboard

---

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'tenant' CHECK (role IN ('admin', 'tenant', 'landlord')),
  user_type TEXT DEFAULT 'tenant',
  -- other fields...
);
```

### Profile Creation Trigger
The `handle_new_user()` trigger function automatically creates profiles when users sign up:
- Reads `role`, `user_type`, and `is_admin` from `auth.users.raw_user_meta_data`
- Creates corresponding profile in `profiles` table
- Handles tenant, landlord, and admin roles

---

## Testing

### Using the Test Dashboard
Open `tmp_rovodev_auth_test.html` in your browser to access a testing dashboard with:
- Quick links to all auth pages
- Pre-filled test credentials
- Role-switching links
- Dashboard access links

### Manual Testing Steps

#### Test 1: Tenant Sign-up
1. Go to `http://localhost:3000/auth/sign-up`
2. Fill in:
   - Full Name: Test Tenant
   - Email: tenant@test.com
   - Password: password123
3. Click "Sign Up"
4. ✅ Should redirect to `/tenant`
5. ✅ Check database: `role='tenant'`, `user_type='tenant'`

#### Test 2: Landlord Sign-up
1. Go to `http://localhost:3000/auth/sign-up?type=landlord`
2. Fill in:
   - Full Name: Test Landlord
   - Email: landlord@test.com
   - Password: password123
3. Click "Sign Up"
4. ✅ Should redirect to `/landlord`
5. ✅ Check database: `role='landlord'`, `user_type='landlord'`

#### Test 3: Admin Sign-up
1. Go to `http://localhost:3000/auth/sign-up`
2. Fill in:
   - Full Name: Test Admin
   - Email: admin@test.com
   - Password: password123
   - ☑️ Check "Register as Admin"
3. Click "Sign Up"
4. ✅ Should redirect to `/admin`
5. ✅ Check database: `role='admin'`, `user_type='admin'`, `is_admin=true`

#### Test 4: Login and Redirects
1. Log out
2. Login with each account
3. ✅ Verify correct dashboard redirect

#### Test 5: Role Switching Links
1. On tenant signup page, click "Sign up as landlord"
2. ✅ Should navigate to landlord signup
3. On landlord login page, click "Sign in as tenant"
4. ✅ Should navigate to tenant login

---

## Database Verification

```sql
-- Check all profiles
SELECT id, email, full_name, role, user_type, is_admin, created_at
FROM profiles
ORDER BY created_at DESC;

-- Verify tenant profile
SELECT * FROM profiles WHERE email = 'tenant@test.com';
-- Expected: role='tenant', user_type='tenant', is_admin=false

-- Verify landlord profile
SELECT * FROM profiles WHERE email = 'landlord@test.com';
-- Expected: role='landlord', user_type='landlord', is_admin=false

-- Verify admin profile
SELECT * FROM profiles WHERE email = 'admin@test.com';
-- Expected: role='admin', user_type='admin', is_admin=true
```

---

## Key Features

### ✅ Implemented Features
1. **Separate Sign-up Flows**: Tenant and landlord can sign up with appropriate roles
2. **Role-based Redirects**: Automatic redirect to correct dashboard after login
3. **Role Switching**: Easy navigation between tenant and landlord auth pages
4. **Backward Compatibility**: Existing admin signup still works
5. **Accessibility**: Fixed dialog accessibility issues
6. **OAuth Support**: Google login with default tenant role (can be changed by admin)
7. **Profile Auto-creation**: Database trigger ensures profiles are created automatically

### 🔄 User Experience
- Clear role distinction on auth pages
- Helpful prompts to switch between tenant/landlord
- Descriptive page titles and descriptions
- Maintains visit scheduling flow for tenants

---

## Files Modified

1. `app/auth/sign-up/page.tsx` - Added landlord signup support
2. `app/api/auth/signup/route.ts` - Enhanced to handle roles
3. `app/auth/login/page.tsx` - Already supported roles (no changes needed)
4. `app/auth/callback/route.ts` - Enhanced landlord detection
5. `components/publicView/schedule-visit-dialog.tsx` - Fixed accessibility

---

## Next Steps for Production

### 1. Email Verification
- Consider requiring email verification before dashboard access
- Customize verification emails per role

### 2. Password Requirements
- Enforce strong password policies
- Add password strength indicator

### 3. Rate Limiting
- Add rate limiting to signup/login endpoints
- Prevent brute force attacks

### 4. OAuth Role Selection
- Allow users to select role during Google OAuth flow
- Or default OAuth users to tenant and let them request landlord upgrade

### 5. Analytics
- Track signup conversion rates by role
- Monitor authentication failures

---

## Troubleshooting

### Issue: User redirected to wrong dashboard
**Solution**: Check profile in database:
```sql
SELECT role, user_type, is_admin FROM profiles WHERE email = 'user@example.com';
UPDATE profiles SET role='landlord', user_type='landlord' WHERE email = 'user@example.com';
```

### Issue: Profile not created after signup
**Solution**: Check if trigger exists and is enabled:
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: "Email already registered"
**Solution**: Delete user from Supabase Auth dashboard or use different email

---

## Summary

The authentication system now fully supports three user types:
- **Tenants**: Find and rent properties
- **Landlords**: Manage properties and tenants
- **Admins**: Full system access

All signup and login flows are working correctly with proper role-based redirects and database profile creation.
