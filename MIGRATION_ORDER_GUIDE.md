# Database Migration Order Guide

## ✅ What You've Already Run

You've confirmed you've already run these migrations:
1. ✅ `COMPLETE_PROPERTIES_SCHEMA.sql`
2. ✅ `MAINTENANCE_SCHEMA.sql`
3. ✅ `PAYMENTS_SCHEMA.sql`
4. ✅ `TENANTS_SCHEMA.sql`

## 🚀 What You Need to Run Now

### **ONLY ONE MIGRATION NEEDED:**

Run this single consolidated migration that includes everything:

```
📁 scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
```

## Why Only One Migration?

I've consolidated all the apartment-related features into a single, optimized migration that:
- ✅ Avoids duplicate column creation
- ✅ Handles all dependencies correctly
- ✅ Includes all features in the right order
- ✅ Is safe to run (uses IF NOT EXISTS)

## 📋 What This Migration Adds

### 1. **Floor Unit Type Configuration**
- Adds `floor_unit_config` JSONB column to `properties` table
- Allows storing per-floor unit type distribution
- Function to generate units from configuration

### 2. **Individual Unit Pricing** ⭐ (Your requested feature)
- Adds `price_ugx` column to `property_units` table
- Stores monthly rental fees per unit (in cents for precision)
- Different prices for different unit types (1BR, 2BR, 3BR, etc.)

### 3. **Updated Unit Types**
- Updates constraint to support: Studio, 1BR, 2BR, 3BR, 4BR, Penthouse
- Modern apartment unit type naming

### 4. **Unit Templates**
- Adds template system for managing similar units
- Automatic synchronization of units with same template
- Option to sync or manage units individually

### 5. **Revenue Calculation Functions**
- `calculate_block_revenue_potential(block_id)` - Revenue for a block
- `calculate_property_revenue_potential(property_id)` - Revenue for entire property
- Includes occupancy rate calculations

### 6. **Management Views**
- `unit_pricing_summary` - See all unit prices
- `property_floor_config_summary` - Floor configuration overview
- `unit_templates_summary` - Template-based units
- `individual_units_summary` - Non-synced units

### 7. **Performance Indexes**
- Indexes on price_ugx, template_name, unit_type, etc.
- Optimized for filtering and querying

## 🎯 How to Run

### Using Supabase Dashboard (Recommended):

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql` in your code editor
5. Copy the entire file contents
6. Paste into Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
8. Wait for "Success. No rows returned" message

### Using psql Command Line:

```bash
psql -U postgres -h your-db-host.supabase.co -d postgres \
  -f scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
```

## ✅ Verify Migration Success

After running, test with these queries:

```sql
-- 1. Check if price_ugx column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'property_units' 
  AND column_name IN ('price_ugx', 'template_name', 'area_sqft');

-- 2. Check if floor_unit_config exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name = 'floor_unit_config';

-- 3. Verify unit type constraint updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'property_units_unit_type_check';

-- 4. Test the views
SELECT * FROM unit_pricing_summary LIMIT 5;
SELECT * FROM property_floor_config_summary LIMIT 5;

-- 5. Test revenue calculation function (replace with real UUID if you have data)
-- SELECT * FROM calculate_property_revenue_potential('your-property-uuid-here');
```

## 📝 Other SQL Files (Not Needed - Already Consolidated)

These files are **NOT needed** as their functionality is included in the consolidated migration:

- ❌ `ADD_UNIT_MONTHLY_FEE.sql` - Superseded by consolidated migration
- ❌ `ADD_UNIT_PRICING_MIGRATION.sql` - Superseded by consolidated migration
- ❌ `FLOOR_UNIT_TYPE_CONFIG.sql` - Superseded by consolidated migration
- ❌ `UNIT_TEMPLATES_ENHANCEMENT.sql` - Superseded by consolidated migration

**Delete or ignore these files** to avoid confusion. The consolidated migration includes all their features.

## 🎉 After Migration

Once the migration completes successfully:

1. ✅ Your database will support individual unit pricing
2. ✅ You can set monthly fees per unit type when creating apartments
3. ✅ The UI feature I implemented will work perfectly
4. ✅ You'll have revenue calculation functions ready to use
5. ✅ Unit templates will help manage similar units efficiently

## 🚨 Migration Safety

This migration is **safe** because:
- ✅ Uses `IF NOT EXISTS` for all new columns/indexes
- ✅ Uses `CREATE OR REPLACE` for functions/views
- ✅ Uses `DROP CONSTRAINT IF EXISTS` before recreating constraints
- ✅ Includes data migration for existing records
- ✅ Backward compatible with existing data
- ✅ Can be run multiple times without errors

## 📊 Expected Results

After running this migration, you should see output like:

```
ALTER TABLE
COMMENT
CREATE INDEX
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
UPDATE X (where X is the number of existing units)
DO
CREATE FUNCTION
GRANT
CREATE FUNCTION
GRANT
DROP TRIGGER
CREATE TRIGGER
CREATE FUNCTION
GRANT
CREATE FUNCTION
GRANT
CREATE VIEW
GRANT
GRANT
CREATE VIEW
GRANT
COMMENT
CREATE VIEW
GRANT
CREATE VIEW
GRANT
```

## 🆘 Troubleshooting

### If you get "column already exists" errors:
- This is normal if you previously ran partial migrations
- The `IF NOT EXISTS` clauses will skip those columns
- Continue with the rest of the migration

### If you get "constraint already exists" errors:
- The script drops existing constraints before recreating them
- This shouldn't happen but is handled safely

### If you get permission errors:
- Make sure you're running as a superuser or database owner
- In Supabase, the SQL Editor runs with appropriate permissions

## 📞 Next Steps After Migration

1. ✅ Verify migration completed (run test queries above)
2. ✅ Test creating a new apartment property in `/admin/properties`
3. ✅ Set different monthly fees for different unit types
4. ✅ Verify units are created with correct prices
5. ✅ Test the revenue calculation functions

## 🎯 Summary

**Run ONLY this one file:**
```
scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
```

**Then you're done!** 🎉

Your application will have full support for setting monthly fees per unit type when creating apartment properties.
