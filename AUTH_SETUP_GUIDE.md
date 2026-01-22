# Authentication Setup Guide

This guide will help you set up comprehensive authentication with Supabase including email/password, Google OAuth, and password recovery.

## Features Implemented

✅ **Email/Password Authentication**
- Sign up with email and password
- Login with email and password
- Email verification support
- Role-based access control (Admin/Tenant)

✅ **Password Recovery**
- Forgot password flow
- Reset password with email link
- Secure password update

✅ **Google OAuth**
- Sign in with Google
- Sign up with Google
- Automatic profile creation

✅ **Route Protection**
- Middleware for protecting `/admin` and `/tenant` routes
- Automatic redirection based on user role
- Session management and refresh

## Setup Instructions

### 1. Configure Google OAuth in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Enable Google Provider**
   - Go to Authentication → Providers
   - Find "Google" and click to configure
   - Toggle "Enable Sign in with Google"

3. **Get Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Copy the Client ID and Client Secret

4. **Configure in Supabase**
   - Paste the Client ID in "Client ID (for OAuth)" field
   - Paste the Client Secret in "Client Secret (for OAuth)" field
   - Click "Save"

### 2. Configure Email Settings

1. **Go to Authentication → Email Templates**
   - Customize the email templates if needed
   - Ensure "Confirm signup" is enabled if you want email verification

2. **Configure Redirect URLs**
   - Go to Authentication → URL Configuration
   - Add your site URL: `http://localhost:3000` (dev) or your production URL
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000/auth/reset-password
     ```

### 3. Database Setup

Ensure you have a `profiles` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'tenant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'tenant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_role_key
```

### 5. Test the Authentication Flow

#### Test Email/Password Authentication:
1. Go to `/auth/sign-up`
2. Create an account with email and password
3. Check your email for verification (if enabled)
4. Click the verification link
5. You should be redirected to the appropriate dashboard

#### Test Google OAuth:
1. Go to `/auth/login`
2. Click "Sign in with Google"
3. Authorize the app
4. You should be redirected to the appropriate dashboard

#### Test Password Recovery:
1. Go to `/auth/login`
2. Click "Forgot password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link and set a new password
6. Login with the new password

### 6. Role-Based Access

The middleware automatically handles role-based access:

- **Admins**: Can access `/admin/*` routes
- **Tenants**: Can access `/tenant/*` routes
- **Not logged in**: Redirected to `/auth/login`
- **Wrong role**: Redirected to appropriate dashboard

## Available Routes

### Public Routes
- `/` - Home page
- `/auth/login` - Login page
- `/auth/sign-up` - Sign up page
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password` - Reset password with token
- `/auth/verify-email` - Email verification message
- `/auth/callback` - OAuth callback handler

### Protected Routes
- `/admin/*` - Admin dashboard (requires `is_admin = true`)
- `/tenant/*` - Tenant dashboard (requires authentication)

## Security Features

1. **Row Level Security (RLS)**: All database tables have RLS policies
2. **Middleware Protection**: Routes are protected at the edge
3. **Session Management**: Automatic session refresh
4. **Role Verification**: Checks both database and user metadata
5. **Secure Password Reset**: Time-limited tokens via email

## Troubleshooting

### Issue: "Invalid Redirect URL"
- Make sure you've added all callback URLs in Supabase dashboard
- Check that your site URL matches the environment

### Issue: "No user session found"
- Clear browser cookies
- Check if email verification is required
- Verify the user exists in Supabase dashboard

### Issue: Google OAuth not working
- Double-check Google Cloud Console credentials
- Ensure authorized redirect URIs are correct
- Check that Google+ API is enabled

### Issue: User redirected to wrong dashboard
- Check `is_admin` field in profiles table
- Verify user_metadata in Supabase dashboard
- Clear session and login again

## Next Steps

1. **Customize Email Templates**: Go to Supabase Dashboard → Authentication → Email Templates
2. **Add More Providers**: Enable GitHub, Facebook, etc.
3. **Implement 2FA**: Add two-factor authentication
4. **Add Profile Management**: Allow users to update their profiles
5. **Add Social Connections**: Link multiple auth providers to one account

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs/guides/auth
- Review the middleware logs
- Check browser console for errors
