# 🚀 START HERE - Authentication Setup (5 Minutes)

## Step 1: Database Setup (2 minutes) ⚡ REQUIRED

### Open Supabase Dashboard
```
https://supabase.com/dashboard/project/nffgbbxgajxwxjmphsxz
```

### Navigate to SQL Editor
- Click **SQL Editor** in left sidebar
- Click **New Query**

### Copy & Paste Setup Script
1. Open file: `scripts/AUTH_PROFILES_SETUP.sql`
2. Copy ALL content
3. Paste into Supabase SQL Editor
4. Click **Run**

### Wait for Success ✅
You should see a success message. If errors, check console.

---

## Step 2: Access the App (1 minute)

### Open Browser
```
http://localhost:3000
```

If you don't see anything, make sure dev server is running:
```bash
npm run dev
```

---

## Step 3: Test Sign Up (1 minute)

### Go to Sign Up Page
```
http://localhost:3000/auth/sign-up
```

### Fill in Form
- **Full Name:** Admin Test
- **Email:** admin@test.com
- **Password:** TestPass123!
- **Check:** "Register as Admin" ✅

### Click Sign Up
- Should redirect to admin dashboard
- If error, check browser console (F12)

---

## Step 4: Test Login (1 minute)

### Go to Logout Page First
```
http://localhost:3000/auth/logout
```

### Go to Login Page
```
http://localhost:3000/auth/login
```

### Login with Credentials
- **Email:** admin@test.com
- **Password:** TestPass123!

### Verify
- Should redirect to `/admin`
- You're now logged in!

---

## ✅ You're Done!

If all steps worked:
- ✅ Database is set up
- ✅ Sign up works
- ✅ Login works
- ✅ Authentication is working perfectly!

---

## 🆘 If Something Went Wrong

### Issue: "Sign up failed"
**Fix:**
1. Check you're on http://localhost:3000 (not 3001)
2. Open browser console (F12)
3. Look for error message
4. Check that database setup ran successfully

### Issue: "Can't access http://localhost:3000"
**Fix:**
```bash
# Make sure dev server is running
npm run dev

# Wait for it to say "Ready in Xs"
# Then try http://localhost:3000 again
```

### Issue: "Button clicking but nothing happens"
**Fix:**
1. Check browser console for errors
2. Check that Supabase project is accessible
3. Verify all environment variables in `.env`

---

## 📚 Need More Help?

- **Full testing guide:** `AUTHENTICATION_VERIFICATION.md`
- **Complete documentation:** `AUTH_SYSTEM_COMPLETE.md`
- **Quick reference:** `QUICK_TEST_AUTH.md`

---

## 🎯 What's Next?

After verification:
1. Create a tenant user (don't check "Register as Admin")
2. Test that tenant can't access `/admin`
3. Test that admin can't access `/tenant`
4. Optional: Enable Google OAuth

---

**Questions?** Check the documentation files or the browser console for error messages!

Happy testing! 🎉
