# ✅ Authentication System Verification Checklist

## 🎯 Current Status: READY FOR TESTING

Your authentication system is fully implemented and configured. Here's what to verify:

---

## 📋 Pre-Test Verification

### Environment Configuration
- ✅ NEXT_PUBLIC_SUPABASE_URL = https://nffgbbxgajxwxjmphsxz.supabase.co
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = configured
- ✅ SUPABASE_SECRET_KEY = configured
- ✅ NEXT_PUBLIC_APP_URL = http://localhost:3000
- ✅ NEXT_PUBLIC_SITE_URL = http://localhost:3000

### Dev Server
- ✅ Running on http://localhost:3000
- ✅ .env file loaded
- ✅ No deprecation warnings

---

## 🧪 Testing Plan (Follow These Steps)

### CRITICAL FIRST STEP: Database Setup
**⚠️ DO THIS BEFORE TESTING AUTH ⚠️**

1. Open: https://supabase.com/dashboard/project/nffgbbxgajxwxjmphsxz
2. Go to: **SQL Editor**
3. Copy entire content from: `scripts/AUTH_PROFILES_SETUP.sql`
4. Paste into Supabase SQL Editor
5. Click **Run**
6. Wait for success message

**This creates:**
- ✅ `profiles` table
- ✅ `handle_new_user()` trigger function
- ✅ `on_auth_user_created` trigger

---

### Test 1: Sign Up (2 minutes)
```
URL: http://localhost:3000/auth/sign-up

Test Data:
- Full Name: Admin Test
- Email: admin@test.com
- Password: TestPass123!
- ✅ Check "Register as Admin"

Expected Result:
✓ Form submits without errors
✓ Redirects to http://localhost:3000/admin
✓ No error messages in console
```

**If it fails:** Check browser console (F12) for error messages

---

### Test 2: Logout and Login (1 minute)
```
URL: http://localhost:3000/auth/logout
Wait for redirect...
URL: http://localhost:3000/auth/login

Test Data:
- Email: admin@test.com
- Password: TestPass123!

Expected Result:
✓ Successful login
✓ Redirects to /admin dashboard
✓ User session is established
```

---

### Test 3: Create Tenant User (1 minute)
```
URL: http://localhost:3000/auth/logout
Then: http://localhost:3000/auth/sign-up

Test Data:
- Full Name: Tenant Test
- Email: tenant@test.com
- Password: TestPass123!
- ⬜ Leave "Register as Admin" UNCHECKED

Expected Result:
✓ Redirects to http://localhost:3000/tenant
✓ Different dashboard than admin
```

---

### Test 4: Route Protection (2 minutes)
```
Test Case A: Not Logged In
─────────────────────────
1. Logout: http://localhost:3000/auth/logout
2. Try: http://localhost:3000/admin
   Expected: Redirect to http://localhost:3000/auth/login

Test Case B: Wrong Role (Tenant accessing Admin)
──────────────────────────────────────────────────
1. Login as: tenant@test.com
2. Try: http://localhost:3000/admin
   Expected: Redirect to http://localhost:3000/tenant

Test Case C: Wrong Role (Admin accessing Tenant)
──────────────────────────────────────────────────
1. Login as: admin@test.com
2. Try: http://localhost:3000/tenant
   Expected: Redirect to http://localhost:3000/admin
```

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify everything:

### Check 1: Profiles Table
```sql
SELECT COUNT(*) as user_count FROM public.profiles;
-- Should show: 2 (admin and tenant users)
```

### Check 2: User Roles
```sql
SELECT email, full_name, is_admin, role 
FROM public.profiles 
ORDER BY created_at DESC;
-- Should show both users with correct roles
```

### Check 3: Trigger Status
```sql
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
-- Should show: on_auth_user_created | t (enabled)
```

### Check 4: All Users
```sql
SELECT email, created_at FROM auth.users;
-- Should show both users created during testing
```

---

## 🛠️ Troubleshooting Guide

### ❌ Problem: "Sign up failed"
**Check:**
1. Are you on http://localhost:3000? (Not 3001 or another port)
2. Did you run the database setup script?
3. Is Supabase project accessible?

**Fix:**
- Verify .env variables
- Re-run `scripts/AUTH_PROFILES_SETUP.sql`
- Check browser console for actual error

---

### ❌ Problem: "User created but no profile"
**Check:**
1. Is trigger function created?
2. Is trigger enabled?

**Fix:**
```sql
-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then run scripts/AUTH_PROFILES_SETUP.sql again
```

---

### ❌ Problem: "Redirect loop or stuck on login"
**Check:**
1. Is the profiles record created?
2. Is role/is_admin set correctly?

**Fix:**
```sql
-- Check profile for user
SELECT * FROM public.profiles WHERE email = 'admin@test.com';

-- If is_admin is false, update it
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'admin@test.com';
```

---

### ❌ Problem: "Port 3000 already in use"
**Solution:**
- Dev server automatically uses 3001
- Access: http://localhost:3001 instead
- Or kill process using port 3000

---

## 📊 Expected Results Summary

| Action | Expected Outcome | Status |
|--------|-----------------|--------|
| Sign up (admin) | Redirect to /admin | ⏳ Test |
| Sign up (tenant) | Redirect to /tenant | ⏳ Test |
| Login (admin) | Access /admin | ⏳ Test |
| Login (tenant) | Access /tenant | ⏳ Test |
| Admin → /tenant | Redirect to /admin | ⏳ Test |
| Tenant → /admin | Redirect to /tenant | ⏳ Test |
| Not logged in → /admin | Redirect to /auth/login | ⏳ Test |
| Database trigger | Profile created on signup | ⏳ Test |

---

## ✅ Success Criteria

Your authentication system is working perfectly when:
1. ✅ Users can sign up with email/password
2. ✅ Users are automatically assigned correct role
3. ✅ Profiles are created automatically
4. ✅ Users redirected to correct dashboard
5. ✅ Protected routes work properly
6. ✅ Role-based access control enforced
7. ✅ No errors in console
8. ✅ Logout works and clears session

---

## 🚀 Next Steps After Verification

Once all tests pass:
1. ✅ Test password reset flow (optional)
2. ✅ Enable Google OAuth (optional)
3. ✅ Customize email templates (optional)
4. ✅ Deploy to production

---

## 📝 Notes

- The login page uses `supabase.auth.signInWithPassword()`
- Admin redirect logic: `router.push(isAdmin ? "/admin" : "/tenant")`
- Profile fetching happens after sign-in to determine role
- Network error handling is implemented
- All auth pages are unsecured (public access)
- Protected pages redirected by proxy middleware

---

## 💡 Pro Tips

1. **Use browser DevTools** - F12 → Application → Cookies to see session
2. **Check console** - F12 → Console to see any errors
3. **Use Supabase Dashboard** - Monitor auth activity and user creation
4. **Keep email/password** - Write down test credentials
5. **Check profiles table** - Verify records created on signup

---

**Ready to Test?** 
1. Run database setup in Supabase
2. Start dev server: `npm run dev`
3. Open: http://localhost:3000
4. Follow the testing plan above

**Questions?** Check the troubleshooting guide above!

Good luck! 🎉
