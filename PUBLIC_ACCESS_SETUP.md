# Setting up Public Access to Properties

This document explains how to configure your Supabase database to allow public (anonymous) access to properties in your Leap application.

## Prerequisites

Make sure your `.env` file contains the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

The `SUPABASE_SECRET_KEY` should be your Supabase Service Role Key, which has elevated privileges to bypass Row Level Security (RLS) policies when needed.

## Database Configuration

To enable public access to properties, you need to run the SQL script that updates the Row Level Security (RLS) policies in your Supabase database.

### Step 1: Run the SQL Script

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to the "SQL Editor" tab
4. Copy and paste the contents of [scripts/ENABLE_PUBLIC_PROPERTY_ACCESS.sql](file:///d:/PROJECTS/Leap/scripts/ENABLE_PUBLIC_PROPERTY_ACCESS.sql)
5. Click "Run" to execute the script

This script will:

- Update the RLS policies for the `properties` table to allow anyone to view active properties
- Update related tables (`property_images`, `property_details`, `property_units`, `property_blocks`) to allow public access to data associated with active properties
- Grant SELECT permissions to the `anon` role for these tables

### Step 2: Verify the Setup

After running the SQL script, you can test the API endpoint directly:

```
GET /api/properties
```

This should return a list of active properties without requiring authentication.

## How It Works

1. The `/api/properties` endpoint uses the `SUPABASE_SECRET_KEY` to create a Supabase client with service role privileges, which can bypass RLS policies.

2. The endpoint fetches only active properties (`is_active = true`) from the database.

3. The RLS policies in the database are configured to allow anonymous users to select data from property-related tables for active properties.

4. The frontend components use the `NEXT_PUBLIC_SUPABASE_ANON_KEY` to access this data directly when needed, but currently the main properties page fetches data server-side via the API route.

## Troubleshooting

If you're still having issues accessing properties:

1. Verify that your environment variables are properly set in your deployment environment (Vercel, Netlify, etc.)
2. Confirm that the property records in your database have `is_active = true`
3. Check that the SQL script was executed successfully in your Supabase dashboard
4. Look for any error messages in your application logs

## Security Note

The configuration allows public read access only to active properties. Write operations still require proper authentication and authorization based on user roles (admin, landlord, etc.).