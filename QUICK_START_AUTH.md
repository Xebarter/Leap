# Quick Start: Authentication Setup

This is a quick reference guide to get authentication working immediately.

## 🚀 Quick Setup (5 minutes)

### Step 1: Run SQL Script in Supabase
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/AUTH_PROFILES_SETUP.sql`
3. Click "Run" to execute

### Step 2: Configure Google OAuth (Optional but Recommended)
1. Go to your Supabase Dashboard → Authentication → Providers
2. Find "Google" and enable it
3. **Get Google Credentials:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable Google+ API
   - Go to Credentials → Create OAuth 2.0 Client ID
   - Add redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

### Step 3: Set Redirect URLs
1. In Supabase Dashboard → Authentication → URL Configuration
2. Add these redirect URLs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset-password
   ```

### Step 4: Test It!
1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/auth/sign-up`
3. Create an account
4. You should be redirected to `/tenant` or `/admin` based on your role

## ✅ What's Been Implemented

### Authentication Methods
- ✅ Email/Password signup and login
- ✅ Google OAuth (sign in with Google)
- ✅ Password recovery (forgot password)
- ✅ Email verification (if enabled in Supabase)

### Route Protection
- ✅ `/admin/*` - Only accessible to admins
- ✅ `/tenant/*` - Only accessible to authenticated users
- ✅ Automatic redirects based on role
- ✅ Session management and refresh

### Pages Created
- `/auth/login` - Login page with Google OAuth
- `/auth/sign-up` - Sign up page with Google OAuth
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password` - Set new password
- `/auth/verify-email` - Email verification message
- `/auth/callback` - OAuth callback handler

## 🔧 Common Issues & Solutions

### "No authenticated user found"
**Solution:** Make sure you're logged in. The middleware now automatically redirects unauthenticated users to login.

### "Access denied" when creating properties
**Solution:** Your user needs `is_admin = true` in the profiles table. Run this SQL:
```sql
UPDATE public.profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Google OAuth not working
**Solution:** 
1. Check redirect URI matches exactly in Google Cloud Console
2. Ensure Google+ API is enabled
3. Verify Client ID and Secret are correct in Supabase

### User redirected to wrong dashboard
**Solution:** Check the `is_admin` field in profiles table:
```sql
SELECT id, email, is_admin, role FROM profiles WHERE email = 'your-email@example.com';
```

## 📝 Testing Checklist

- [ ] Sign up with email/password works
- [ ] Login with email/password works
- [ ] Sign in with Google works (if configured)
- [ ] Forgot password sends email
- [ ] Reset password works
- [ ] Admin users can access `/admin/*`
- [ ] Tenant users can access `/tenant/*`
- [ ] Unauthenticated users are redirected to login
- [ ] Users can't access wrong dashboard (admin/tenant)

## 🎯 Next Steps

1. **Create your first admin user:**
   ```sql
   UPDATE public.profiles 
   SET is_admin = true, role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

2. **Test property creation** at `/admin/properties`

3. **Customize email templates** in Supabase Dashboard → Authentication → Email Templates

4. **Add more OAuth providers** (GitHub, Facebook, etc.) if needed

## 📚 Full Documentation

For detailed information, see `AUTH_SETUP_GUIDE.md`

## 💡 Tips

- **Development:** You can toggle `is_admin` in the sign-up form for testing
- **Production:** Remove the admin checkbox and manage admin users via SQL
- **Security:** The middleware protects all routes automatically
- **Session:** Sessions persist across browser refreshes
- **Logout:** Visit `/auth/logout` to sign out

## 🆘 Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Check your terminal/server logs
3. Verify your `.env` file has correct Supabase credentials
4. Review the full `AUTH_SETUP_GUIDE.md` for detailed troubleshooting
