# Tenant Number Feature - Setup Guide

## Overview
Every tenant now gets a unique 10-digit identification number automatically assigned when they sign up. This number is displayed prominently on their dashboard.

## Features
- ✅ **Unique 10-digit number** for each tenant
- ✅ **Automatic assignment** during profile creation
- ✅ **Displayed prominently** on tenant dashboard
- ✅ **Cannot be changed** by tenant (unique identifier)
- ✅ **Works for existing and new tenants**

## Setup Instructions

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor** → **New Query**
3. Open the file `scripts/ADD_TENANT_NUMBER.sql`
4. Copy the entire contents and paste into the SQL Editor
5. Click **RUN**

### Step 2: Verify the Setup

After running the script, you should see verification results showing:
- ✓ Column exists
- ✓ Index exists
- ✓ Trigger exists
- ✓ All profiles have tenant numbers

You'll also see a sample of tenant numbers assigned to existing users.

### Step 3: Test the Feature

#### For Existing Tenants:
1. Log in as an existing tenant
2. Go to the tenant dashboard (`/tenant`)
3. You should see a badge displaying "Tenant ID: XXXXXXXXXX" (10 digits) below the welcome message

#### For New Tenants:
1. Sign up a new tenant account
2. Complete the signup process
3. Navigate to `/tenant/profile` to create a tenant profile
4. Once the profile is created, go back to dashboard
5. The tenant number will be automatically assigned and displayed

## Technical Details

### Database Schema
```sql
-- tenant_profiles table now has:
tenant_number TEXT UNIQUE  -- 10-digit unique identifier
```

### How It Works

1. **Automatic Generation**: When a tenant_profile record is created, a trigger automatically generates a unique 10-digit number
2. **Uniqueness Guaranteed**: The generation function checks for duplicates and regenerates if needed
3. **Non-Zero Start**: Numbers always start with 1-9 (not 0) to ensure full 10 digits
4. **Indexed**: Fast lookups via database index

### Files Modified

1. **scripts/ADD_TENANT_NUMBER.sql** - Database migration script
   - Adds tenant_number column
   - Creates generation function
   - Creates auto-assignment trigger
   - Updates existing profiles

2. **app/(dashboard)/tenant/page.tsx** - Tenant dashboard
   - Displays tenant number in a badge
   - Positioned below welcome message
   - Styled with primary colors for visibility

## Display Location

The tenant number appears on the **Tenant Dashboard** (`/tenant`):
- Located in the header section
- Below the "Welcome back" message
- Displayed as a badge with monospace font
- Format: "Tenant ID: 1234567890"

## Troubleshooting

### Tenant number not showing
1. Check if tenant_profile exists for the user
2. Verify the database migration ran successfully
3. Check browser console for any errors
4. Ensure tenant is logged in

### Duplicate tenant numbers
- This should never happen due to uniqueness constraint
- If it does, the trigger will keep generating until a unique number is found

### Existing tenants don't have numbers
- Run the UPDATE statement in the migration script
- It will assign numbers to all existing profiles

## Future Enhancements

Potential improvements:
- Display tenant number on profile page
- Add copy-to-clipboard functionality
- Include tenant number in email communications
- Use tenant number for support tickets
- Add search by tenant number in admin panel

## Support

If you encounter any issues:
1. Check the verification queries in the migration script
2. Ensure all database policies allow INSERT on tenant_profiles
3. Check Supabase logs for any trigger errors
4. Verify the tenant_profile record exists for the user
