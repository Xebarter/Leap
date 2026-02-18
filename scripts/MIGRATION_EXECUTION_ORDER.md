# Database Migration Execution Order

This guide provides the correct order to execute SQL migration scripts to avoid dependency issues.

## Prerequisites
- Access to Supabase SQL Editor or direct database connection
- Admin/owner permissions on the database

## Execution Order

### Step 1: Core Schema Setup
Run these first as they create the foundational tables:

1. **`PAYMENTS_SCHEMA.sql`** - Creates payment_transactions table (base structure)
2. **`AUTH_PROFILES_SETUP.sql`** - Creates profiles table for users
3. **`TENANTS_SCHEMA.sql`** - Creates tenant-related tables
4. **`LANDLORDS_SCHEMA.sql`** - Creates landlord-related tables
5. **`MAINTENANCE_SCHEMA.sql`** - Creates maintenance tables

### Step 2: Add Missing Columns to Payment Transactions
**`ADD_PAYMENT_TRANSACTIONS_MISSING_COLUMNS.sql`** 
- Adds: email, phone_number, property_code, reservation_id (without FK)
- ⚠️ Run this BEFORE creating the reservations table

### Step 3: Create Reservations Table
**`CREATE_RESERVATIONS_TABLE.sql`**
- Creates the reservations table with all policies

### Step 4: Add Foreign Key Constraint
**`ADD_PAYMENT_RESERVATION_FK.sql`**
- Adds foreign key constraint linking payment_transactions.reservation_id to reservations.id
- ⚠️ Run this AFTER creating the reservations table

### Step 5: Additional Features (Run in any order after Steps 1-4)
- `ADD_TENANT_NUMBER.sql`
- `ADD_PROPERTY_VIEWS_INTERESTED.sql`
- `ADD_VISIT_BOOKING_SUPPORT.sql`
- `ADD_GOOGLE_MAPS_FIELD.sql`
- `ADD_PROPERTY_CODE.sql`
- `ADD_PROPERTY_OCCUPANCY_TRACKING.sql`
- Any other feature-specific migrations

## Quick Commands

If you have PostgreSQL CLI access:
```bash
# Step 1: Core schemas
psql your_database < scripts/PAYMENTS_SCHEMA.sql
psql your_database < scripts/AUTH_PROFILES_SETUP.sql
# ... other core schemas

# Step 2: Add payment columns
psql your_database < scripts/ADD_PAYMENT_TRANSACTIONS_MISSING_COLUMNS.sql

# Step 3: Create reservations
psql your_database < scripts/CREATE_RESERVATIONS_TABLE.sql

# Step 4: Add FK constraint
psql your_database < scripts/ADD_PAYMENT_RESERVATION_FK.sql
```

## Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Open each file in order
4. Copy and paste the contents
5. Click "Run" to execute

## Troubleshooting

**Error: relation "public.reservations" does not exist**
- Make sure you ran `CREATE_RESERVATIONS_TABLE.sql` before `ADD_PAYMENT_RESERVATION_FK.sql`

**Error: column already exists**
- Safe to ignore if using `ADD COLUMN IF NOT EXISTS`

**Error: constraint already exists**
- The constraint was already added, you can skip this step

## Verification

After running all migrations, verify with:
```sql
-- Check payment_transactions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' 
AND table_schema = 'public';

-- Check foreign key constraint
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE constraint_name = 'fk_payment_transactions_reservation_id';
```
