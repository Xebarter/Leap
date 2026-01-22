# 🎨 Authentication System - Visual Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   Auth Pages     │  │  Protected Pages │                 │
│  │ • Login          │  │ • /admin/*       │                 │
│  │ • Sign Up        │  │ • /tenant/*      │                 │
│  │ • Forgot Pass    │  │ • /api/*         │                 │
│  └──────────────────┘  └──────────────────┘                 │
│          ▲                       ▲                           │
│          │                       │                           │
└──────────┼───────────────────────┼─────────────────────────┘
           │                       │
           │ HTTP Requests         │
           ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 16 Server                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  proxy.ts (Middleware)                              │   │
│  │  • Check Authentication                             │   │
│  │  • Validate Session                                 │   │
│  │  • Check User Role                                  │   │
│  │  • Redirect if Unauthorized                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │  lib/supabase/proxy.ts                           │      │
│  │  • Initialize Supabase Client                    │      │
│  │  • Get Current User                              │      │
│  │  • Fetch User Profile                            │      │
│  │  • Check Role (admin/tenant)                     │      │
│  │  • Apply Route Protection                        │      │
│  └──────────────────────────────────────────────────┘      │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        │ API Calls
                        ▼
        ┌───────────────────────────────┐
        │    Supabase Auth Service      │
        │                               │
        │ • User Management             │
        │ • Session Management          │
        │ • OAuth Providers             │
        │ • JWT Token Validation        │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    PostgreSQL Database        │
        │                               │
        │ • auth.users (Supabase)       │
        │ • public.profiles (Custom)    │
        │ • Triggers & Functions        │
        └───────────────────────────────┘
```

---

## 🔄 Authentication Flow Diagrams

### 1. Sign Up Flow

```
User fills form
    │
    ▼
Click "Sign Up" button
    │
    ▼
POST /api/auth/signup
    │
    ├─► Validate email & password
    │
    ├─► Call supabase.auth.signUp()
    │
    ├─► Supabase creates user in auth.users
    │
    ├─► Database trigger fires
    │   └─► handle_new_user() function
    │       └─► INSERT into public.profiles
    │           ├─ id (user ID)
    │           ├─ email
    │           ├─ full_name
    │           ├─ is_admin (from form)
    │           └─ role (admin or tenant)
    │
    ├─► Email verification sent (optional)
    │
    ▼
Redirect to dashboard
    │
    ├─► If admin → /admin
    └─► If tenant → /tenant
```

### 2. Login Flow

```
User enters credentials
    │
    ▼
Click "Login" button
    │
    ▼
Call supabase.auth.signInWithPassword()
    │
    ├─► Validate credentials with Supabase
    │
    ├─► If valid:
    │   ├─► Get user object
    │   ├─► Session cookie set
    │   │
    │   ├─► Query profiles table
    │   │   └─► SELECT is_admin WHERE id = user.id
    │   │
    │   ├─► Check role
    │   │   ├─► is_admin = true → Redirect /admin
    │   │   └─► is_admin = false → Redirect /tenant
    │   │
    │   └─► Route.refresh() to update page
    │
    └─► If invalid:
        └─► Show error message
```

### 3. Route Protection Flow

```
User requests protected route
    │
    ▼
proxy.ts middleware intercepts
    │
    ├─► Call supabase.auth.getUser()
    │
    ├─► Check if user exists
    │   │
    │   ├─► NO → Redirect /auth/login
    │   │
    │   └─► YES
    │       │
    │       ├─► Query profiles table
    │       │   └─► SELECT is_admin WHERE id = user.id
    │       │
    │       ├─► Check route + role match
    │       │
    │       ├─► Admin user + /tenant route?
    │       │   └─► Redirect /admin
    │       │
    │       ├─► Tenant user + /admin route?
    │       │   └─► Redirect /tenant
    │       │
    │       └─► Role matches route?
    │           └─► Allow access (NextResponse.next())
    │
    ▼
Either allow or redirect
```

### 4. OAuth (Google) Flow

```
User clicks "Sign in with Google"
    │
    ▼
Call supabase.auth.signInWithOAuth({ provider: 'google' })
    │
    ▼
Redirect to Google consent screen
    │
    ▼
User authorizes app
    │
    ▼
Google redirects to /auth/callback with auth code
    │
    ▼
supabase.auth.exchangeCodeForSession()
    │
    ├─► Exchange code for session
    │
    ├─► Supabase creates/updates user in auth.users
    │
    ├─► Trigger fires (if new user)
    │   └─► Profile created in public.profiles
    │
    ├─► Query profiles table
    │
    ▼
Redirect to dashboard
    ├─► If admin → /admin
    └─► If tenant → /tenant
```

---

## 📊 Database Schema

```
┌────────────────────────────────────────┐
│         auth.users (Supabase)          │
├────────────────────────────────────────┤
│ id (UUID) PRIMARY KEY                  │
│ email (TEXT)                           │
│ encrypted_password (BYTEA)             │
│ user_metadata (JSONB)                  │
│ ├─ full_name                          │
│ ├─ is_admin                           │
│ ├─ role                               │
│ └─ user_type                          │
│ created_at (TIMESTAMPTZ)              │
│ updated_at (TIMESTAMPTZ)              │
│ last_sign_in_at (TIMESTAMPTZ)         │
└────────────────────────────────────────┘
           │
           │ FK reference
           ▼
┌────────────────────────────────────────┐
│      public.profiles (Custom)          │
├────────────────────────────────────────┤
│ id (UUID) PRIMARY KEY                  │
│ email (TEXT)                           │
│ full_name (TEXT)                       │
│ is_admin (BOOLEAN) DEFAULT false       │
│ role (TEXT) DEFAULT 'tenant'           │
│ user_type (TEXT) DEFAULT 'tenant'      │
│ created_at (TIMESTAMPTZ)               │
│ updated_at (TIMESTAMPTZ)               │
└────────────────────────────────────────┘

Database Trigger:
─────────────────
Event: INSERT on auth.users
Function: handle_new_user()
Action: INSERT new row into public.profiles
```

---

## 🔐 Role-Based Access Control

```
┌────────────────────────────────────────────────┐
│              User Authentication               │
└────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
    Admin User               Tenant User
   (is_admin=true)         (is_admin=false)
        │                           │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
    /admin/*                   /tenant/*
  (Admin Dashboard)         (Tenant Dashboard)
        │                           │
    ┌───┴───────────────────────┬───┘
    │                           │
    ├─► Properties Management   ├─► My Profile
    ├─► Tenant Management       ├─► Bookings
    ├─► Payments                ├─► Payments
    ├─► Maintenance             ├─► Maintenance
    ├─► Analytics               ├─► Notices
    └─► Settings                └─► Documents

Cross-Access Prevention:
─────────────────────────
Admin → /tenant/* → Redirect /admin
Tenant → /admin/* → Redirect /tenant
Not Logged In → /admin/* or /tenant/* → Redirect /auth/login
```

---

## 📝 File Structure

```
Authentication System Files:
──────────────────────────

proxy.ts (Entry Point)
├─ Proxy middleware for Next.js 16
└─ Routes all requests

lib/supabase/
├─ client.ts
│  └─ Browser-side Supabase client
│     (Uses createClient)
│
├─ server.ts
│  └─ Server-side Supabase client
│     (Uses createServerClient)
│
├─ middleware.ts
│  └─ Legacy middleware (deprecated)
│
└─ proxy.ts
   ├─ Proxy middleware logic
   ├─ Auth validation
   ├─ Role checking
   └─ Route protection

app/auth/
├─ login/page.tsx
│  ├─ Email/Password login form
│  ├─ Google OAuth button
│  └─ Password reset link
│
├─ sign-up/page.tsx
│  ├─ Email/Password signup form
│  ├─ Admin role checkbox
│  └─ Terms agreement
│
├─ callback/route.ts
│  ├─ OAuth callback handler
│  └─ Session exchange
│
├─ logout/route.ts
│  └─ Clear session and redirect
│
├─ verify-email/page.tsx
│  └─ Email verification message
│
├─ forgot-password/page.tsx
│  └─ Password reset request form
│
└─ reset-password/page.tsx
   └─ Password reset form

app/api/auth/
└─ signup/route.ts
   ├─ Server-side signup API
   ├─ Validation
   └─ Error handling

scripts/
└─ AUTH_PROFILES_SETUP.sql
   ├─ Create profiles table
   ├─ Create handle_new_user() function
   └─ Create on_auth_user_created trigger
```

---

## 🔗 Request Flow Sequence

```
1. User → Browser Request
   │
2. Browser → Next.js Server (proxy.ts)
   │
3. proxy.ts → supabase.auth.getUser()
   │
4. Supabase → PostgreSQL (auth.users)
   │
5. PostgreSQL → Supabase (user object)
   │
6. Supabase → Next.js (user data)
   │
7. proxy.ts → PostgreSQL (profiles table)
   │
8. PostgreSQL → proxy.ts (profile data)
   │
9. proxy.ts → Decision Logic
   ├─ Check role
   ├─ Check route
   └─ Allow or redirect
   │
10. Next.js → Browser (response or redirect)
```

---

## 🎯 State Management

```
During Authentication:
─────────────────────

1. Sign Up/Login
   ├─ Supabase stores session in browser cookies
   ├─ Session includes JWT token
   └─ Token sent with each request

2. Route Access
   ├─ proxy.ts reads session from cookies
   ├─ Validates session with Supabase
   └─ Fetches user profile if valid

3. Protected Pages
   ├─ Page components check if logged in
   ├─ Show loading state while fetching
   └─ Render content or error

4. Logout
   ├─ Clear session cookies
   ├─ Invalidate JWT token
   └─ Redirect to public page
```

---

## 🛡️ Security Layers

```
Layer 1: Network
└─ HTTPS/SSL encryption
  └─ Data in transit is encrypted

Layer 2: Authentication
├─ Email/Password hashing
├─ JWT tokens
└─ OAuth tokens

Layer 3: Session Management
├─ HTTP-only cookies
├─ Secure flag
├─ SameSite protection
└─ Expiration handling

Layer 4: Authorization
├─ Server-side role checking
├─ Database triggers
└─ Route protection middleware

Layer 5: Database
├─ Row Level Security (RLS)
├─ Foreign key constraints
└─ Data encryption at rest
```

---

## ✅ Testing Checklist Visual

```
┌─ Database Setup ────────────────────┐
│ [ ] Run AUTH_PROFILES_SETUP.sql     │
│ [ ] Verify profiles table created   │
│ [ ] Verify trigger created          │
└─────────────────────────────────────┘
         │
         ▼
┌─ Sign Up Test ──────────────────────┐
│ [ ] Admin sign up succeeds          │
│ [ ] Profile created in DB           │
│ [ ] Redirect to /admin              │
│ [ ] No console errors               │
└─────────────────────────────────────┘
         │
         ▼
┌─ Login Test ────────────────────────┐
│ [ ] Logout first                    │
│ [ ] Login succeeds                  │
│ [ ] Session created                 │
│ [ ] Redirect to /admin              │
│ [ ] No console errors               │
└─────────────────────────────────────┘
         │
         ▼
┌─ Tenant User Test ──────────────────┐
│ [ ] Tenant sign up succeeds         │
│ [ ] Redirect to /tenant             │
│ [ ] Tenant login works              │
│ [ ] Tenant can access /tenant       │
└─────────────────────────────────────┘
         │
         ▼
┌─ Access Control Test ───────────────┐
│ [ ] Admin → /tenant redirects       │
│ [ ] Tenant → /admin redirects       │
│ [ ] Not logged in → redirects login │
│ [ ] After login → correct dashboard │
└─────────────────────────────────────┘
         │
         ▼
    ✅ READY FOR PRODUCTION
```

---

## 📞 Quick Reference

| Action | File | Function |
|--------|------|----------|
| Sign Up | `app/auth/sign-up/page.tsx` | User registration |
| Login | `app/auth/login/page.tsx` | User authentication |
| Auth Callback | `app/auth/callback/route.ts` | OAuth handling |
| Logout | `app/auth/logout/route.ts` | Clear session |
| API Signup | `app/api/auth/signup/route.ts` | Server signup |
| Route Protection | `proxy.ts` | Middleware protection |
| Supabase Client | `lib/supabase/client.ts` | Browser client |
| DB Setup | `scripts/AUTH_PROFILES_SETUP.sql` | Database schema |

---

**This visual guide summarizes the entire authentication system!** 🎉
