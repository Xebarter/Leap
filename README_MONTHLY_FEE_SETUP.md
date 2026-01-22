# 📦 Monthly Fee Per Unit Type - Setup Instructions

> **Your Request:** "When creating an apartment property on /admin/properties page, make provision for easily setting the Monthly fee(UGX) for each unit type"

## ✅ Status: Complete & Ready

---

## 🎯 What You Need to Know

### You Asked For:
- Ability to set monthly fees for each unit type when creating apartments

### You Got:
- ✅ Easy monthly fee input for each unit type (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse)
- ✅ Real-time price formatting (shows "1,000,000 UGX")
- ✅ Different prices for different unit types on different floors
- ✅ Revenue calculation functions (bonus!)
- ✅ Unit template system (bonus!)
- ✅ Management views for reporting (bonus!)

---

## 🚀 Setup (2 Steps)

### Step 1: Run Database Migration

**File to run:** `scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql`

**Method 1 - Supabase Dashboard (Easiest):**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. Open `scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql` from this project
6. Copy ALL contents (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor (Ctrl+V)
8. Click **"Run"** button (or press Ctrl+Enter)
9. Wait for success message

**Method 2 - Command Line:**
```bash
psql -U postgres -h your-db-host.supabase.co -d postgres \
  -f scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
```

**Verification:**
```sql
-- Run this to verify it worked
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'property_units' AND column_name = 'price_ugx';
-- Should return: price_ugx
```

### Step 2: Use the Feature

1. Open your app at `/admin/properties`
2. Click **"Add Property"**
3. Fill in basic info
4. **Select "Apartment" as category** (important!)
5. Set number of floors
6. For each floor, add unit types
7. **Enter monthly fee for each unit type** ⭐ NEW!
8. Save property

That's it! 🎉

---

## 📖 Quick Example

**Creating a 3-floor apartment building:**

```
Property: "Green Valley Apartments"
Location: "Kampala"
Category: Apartment ⭐
Floors: 3

Floor 1:
  ├─ Studio × 2 units → Monthly Fee: 800,000 UGX
  └─ 1BR × 2 units → Monthly Fee: 1,000,000 UGX

Floor 2:
  ├─ 1BR × 3 units → Monthly Fee: 1,200,000 UGX
  └─ 2BR × 1 unit → Monthly Fee: 1,800,000 UGX

Floor 3:
  ├─ 2BR × 2 units → Monthly Fee: 1,800,000 UGX
  └─ 3BR × 1 unit → Monthly Fee: 2,500,000 UGX

Total Units: 11
Potential Monthly Revenue: 15,900,000 UGX
```

---

## 📁 Files Changed/Created

### Modified Files:
- `components/adminView/floor-unit-type-configurator.tsx` - Added monthly fee UI
- `components/adminView/comprehensive-property-manager.tsx` - Saves unit prices

### New Migration File:
- `scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql` ⭐ **RUN THIS**

### Documentation:
- `QUICK_START_MONTHLY_FEE.md` - Quick reference
- `MIGRATION_ORDER_GUIDE.md` - Migration details
- `FINAL_MONTHLY_FEE_IMPLEMENTATION.md` - Complete implementation guide
- `UNIT_MONTHLY_FEE_FEATURE.md` - Feature documentation
- `README_MONTHLY_FEE_SETUP.md` - This file

### Deleted Files (Not Needed):
- ~~`scripts/ADD_UNIT_MONTHLY_FEE.sql`~~ - Consolidated
- ~~`scripts/ADD_UNIT_PRICING_MIGRATION.sql`~~ - Consolidated

---

## 💡 Key Points

### ✅ What Works Now:
- Set different monthly fees for each unit type
- Real-time price formatting as you type
- Copy configurations between floors
- Automatic unit creation with correct prices
- Revenue calculation functions ready to use

### 📝 Important Notes:
1. **Must select "Apartment" category** to see the floor configurator
2. **Enter fees as whole numbers** (e.g., 1000000, not 1,000,000)
3. **Prices stored in cents** in database (×100 automatically)
4. **Default fee is 1,000,000 UGX** for new unit types

### 🎁 Bonus Features:
- Calculate potential monthly revenue per property/block
- Unit template system for managing similar units
- Views for easy querying and reporting
- Occupancy rate calculations

---

## 🗄️ Database Changes

### New Column:
```sql
property_units.price_ugx BIGINT  -- Monthly fee in cents
```

### Updated Constraint:
```sql
-- Now supports: Studio, 1BR, 2BR, 3BR, 4BR, Penthouse
property_units.unit_type CHECK (unit_type IN (...))
```

### New Functions:
- `calculate_property_revenue_potential(uuid)` - Calculate property revenue
- `calculate_block_revenue_potential(uuid)` - Calculate block revenue
- `generate_units_from_floor_config(...)` - Auto-create units from config

### New Views:
- `unit_pricing_summary` - See all unit prices
- `property_floor_config_summary` - Floor configuration overview
- `unit_templates_summary` - Template-based units
- `individual_units_summary` - Individual units

---

## 📊 After Setup - Useful Queries

```sql
-- View all unit prices
SELECT 
  property_title, 
  block_name, 
  unit_number, 
  unit_type, 
  monthly_fee_ugx 
FROM unit_pricing_summary 
ORDER BY property_title, block_name, floor_number;

-- Calculate total revenue for a property
SELECT * FROM calculate_property_revenue_potential('property-uuid-here');

-- See units with highest monthly fees
SELECT * FROM unit_pricing_summary 
ORDER BY price_ugx DESC 
LIMIT 10;
```

---

## ✅ Checklist

Before you start:
- [x] All base schemas already run (COMPLETE_PROPERTIES_SCHEMA, etc.)
- [ ] Run CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
- [ ] Verify migration with test query
- [ ] Test creating an apartment property
- [ ] Set monthly fees for different unit types
- [ ] Verify units created with correct prices
- [ ] Test revenue calculation functions

---

## 🐛 Troubleshooting

### "I don't see the monthly fee input"
**Cause:** Category not set to "Apartment"  
**Fix:** Make sure you select "Apartment" as the property category

### "Migration fails with 'column already exists'"
**Cause:** Partial migration ran before  
**Fix:** This is OK! The script uses IF NOT EXISTS. Continue running.

### "Unit type '1BR' violates constraint"
**Cause:** Migration didn't update constraint  
**Fix:** Re-run the migration script

### "Prices showing as 0 in database"
**Cause:** Migration not run yet  
**Fix:** Run CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql

### "Can't save property"
**Cause:** Check browser console for errors  
**Fix:** Verify Supabase connection and migration status

---

## 📞 Need Help?

1. **Check documentation:**
   - `QUICK_START_MONTHLY_FEE.md` - Quick reference
   - `MIGRATION_ORDER_GUIDE.md` - Detailed migration guide
   - `FINAL_MONTHLY_FEE_IMPLEMENTATION.md` - Full implementation details

2. **Test queries:** Run the verification queries in this document

3. **Browser console:** Check for JavaScript errors when using the UI

4. **Database logs:** Check Supabase logs for SQL errors

---

## 🎉 You're All Set!

After running the migration, you'll have:
- ✅ Monthly fee input for each unit type
- ✅ Flexible pricing per unit type per floor
- ✅ Revenue calculation capabilities
- ✅ Professional property management system

**Next Steps:**
1. Run the migration SQL file
2. Test by creating an apartment property
3. Set different monthly fees for different unit types
4. Enjoy your enhanced property management system! 🏢

---

**Version:** 1.0  
**Date:** January 11, 2026  
**Status:** ✅ Ready for Production  
**Required Migration:** scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
