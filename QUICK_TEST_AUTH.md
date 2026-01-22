# 🚀 Quick Authentication Test Guide

## Pre-flight Checks ✅

Run this command to verify everything is configured:
```bash
node tmp_rovodev_validate_env.js
```

Expected output: All items should show ✅

---

## 🗄️ Database Setup (REQUIRED - Do This First!)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select project: `nffgbbxgajxwxjmphsxz`
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run Setup Script
1. Open file: `scripts/AUTH_PROFILES_SETUP.sql`
2. Copy the entire content
3. Paste into Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Database Setup
1. Copy content from: `tmp_rovodev_database_check.sql`
2. Paste into Supabase SQL Editor
3. Click "Run" button
4. Check results - all should show ✅

---

## 🧪 Manual Testing (5 Minutes)

### Test 1: Sign Up (2 min)
```bash
# Start dev server
npm run dev
```

1. Open: http://localhost:3000/auth/sign-up
2. Fill in form:
   - Full Name: "Test Admin"
   - Email: "admin@test.com"
   - Password: "Test123!"
   - ✅ Check "Register as Admin"
3. Click "Sign Up"
4. **Expected**: Redirect to `/admin` dashboard

### Test 2: Logout and Login (1 min)
1. Logout (if there's a logout button in UI)
   - Or navigate to: http://localhost:3000/auth/logout
2. Go to: http://localhost:3000/auth/login
3. Login with credentials from Test 1
4. **Expected**: Redirect to `/admin` dashboard

### Test 3: Create Tenant User (1 min)
1. Logout
2. Go to: http://localhost:3000/auth/sign-up
3. Fill in form:
   - Full Name: "Test Tenant"
   - Email: "tenant@test.com"
   - Password: "Test123!"
   - ⬜ Leave "Register as Admin" UNCHECKED
4. Click "Sign Up"
5. **Expected**: Redirect to `/tenant` dashboard

### Test 4: Route Protection (1 min)
1. Logout
2. Try to access: http://localhost:3000/admin
   - **Expected**: Redirect to login page
3. Login as tenant user (tenant@test.com)
4. Try to access: http://localhost:3000/admin
   - **Expected**: Redirect to `/tenant` (not authorized)
5. Logout and login as admin user
6. Try to access: http://localhost:3000/tenant
   - **Expected**: Redirect to `/admin`

---

## ✅ Test Results Checklist

- [ ] Environment variables validated
- [ ] Database setup completed
- [ ] Admin user can sign up
- [ ] Admin user can login
- [ ] Tenant user can sign up
- [ ] Tenant user can login
- [ ] Protected routes redirect properly
- [ ] Role-based access control works
- [ ] No console errors during auth flow

---

## 🔧 Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Fix**: Check `.env` file has all variables from `.env.local.example`

### Issue: "User created but no profile"
**Fix**: Run `scripts/AUTH_PROFILES_SETUP.sql` in Supabase Dashboard

### Issue: "Cannot access /admin or /tenant"
**Fix**: Verify user is logged in - check browser dev tools → Application → Cookies

### Issue: Build warning about middleware
**Fix**: This is expected - we've migrated to proxy pattern. Warning can be ignored.

---

## 🎯 Success Criteria

Your authentication system is working perfectly if:
1. ✅ Users can sign up with email/password
2. ✅ Users can login with email/password
3. ✅ Profiles are automatically created
4. ✅ Admin users go to `/admin`
5. ✅ Tenant users go to `/tenant`
6. ✅ Unauthorized access is blocked
7. ✅ No errors in console

---

## 📊 Database Verification Queries

Run these in Supabase SQL Editor to check:

```sql
-- See all users
SELECT email, created_at FROM auth.users;

-- See all profiles
SELECT email, full_name, is_admin, role FROM public.profiles;

-- Verify trigger is working (counts should match)
SELECT 
  (SELECT COUNT(*) FROM auth.users) as users,
  (SELECT COUNT(*) FROM public.profiles) as profiles;
```

---

## 🚀 Ready for Production?

- ✅ All tests passing
- ✅ Database triggers working
- ✅ RLS policies enabled
- ✅ Environment variables secure
- ⚠️ OAuth providers configured (if needed)
- ⚠️ Email templates customized (if needed)

**Next**: Deploy to Vercel/Netlify and update environment variables!
