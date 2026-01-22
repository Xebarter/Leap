# Setting Up Admin Access for Property Management

This guide explains how to enable CRUD operations for properties via the admin dashboard using your `SUPABASE_SECRET_KEY`.

## Prerequisites

- Ensure your `SUPABASE_SECRET_KEY` is properly set in your `.env` file
- Ensure you have an account in the system with admin privileges

## Step 1: Grant Admin Role to Your Account

Run the following SQL command in your Supabase SQL editor to grant admin privileges to your account:

```sql
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE email = 'your-email@example.com';  -- Replace with your actual email
```

## Step 2: Fix Database Permissions (Optional)

If you're having trouble accessing the properties data, run the SQL commands in:

```
FIX_PROPERTY_PERMISSIONS_ADMIN_ROLE.sql
```

Located at `scripts/FIX_PROPERTY_PERMISSIONS_ADMIN_ROLE.sql`.

## Step 3: Run Database Migration Scripts

Make sure your database is properly set up by running the complete schema migration:

1. Navigate to the `scripts` folder
2. Execute `COMPLETE_PROPERTIES_SCHEMA.sql` in your Supabase SQL editor
3. Execute `FIX_PROPERTY_PERMISSIONS_ADMIN_ROLE.sql` to ensure proper permissions

## Step 4: Access the Admin Dashboard

1. Log in to the application
2. Navigate to `/admin/properties`
3. You should now be able to perform all CRUD operations on properties

## Troubleshooting

If you still experience issues:

1. Verify that your `.env` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SECRET_KEY=your_service_role_key
   ```

2. Check that your Supabase project has RLS (Row Level Security) configured properly

3. Make sure you're logged in with an account that has admin privileges

## API Endpoints Used

The property management system uses the following API endpoints in `/app/api/properties/route.ts`:

- `GET /api/properties` - Fetch all properties
- `POST /api/properties` - Create or update a property
- `PUT /api/properties` - Update a property (alias for POST)
- `DELETE /api/properties` - Delete a property

These endpoints use your `SUPABASE_SECRET_KEY` (service role) to bypass RLS and perform admin-level operations.