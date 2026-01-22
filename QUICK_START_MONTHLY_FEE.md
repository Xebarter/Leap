# 🚀 Quick Start: Monthly Fee Per Unit Type

## ⚡ TL;DR - What You Need to Do

### 1️⃣ Run This SQL Script (Once)
```
📁 scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql
```

**How:**
- Open Supabase Dashboard → SQL Editor → New Query
- Copy/paste the file contents
- Click "Run"
- Done! ✅

### 2️⃣ Use the Feature
- Go to `/admin/properties`
- Add new property → Select "Apartment"
- Configure floors
- **Set monthly fee for each unit type** ⭐
- Save

---

## 📋 Migration Summary

### Before You've Already Run:
✅ COMPLETE_PROPERTIES_SCHEMA.sql  
✅ MAINTENANCE_SCHEMA.sql  
✅ PAYMENTS_SCHEMA.sql  
✅ TENANTS_SCHEMA.sql  

### Now Run (ONLY THIS):
📌 **CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql**

### Skip These (Already Included Above):
❌ ~~ADD_UNIT_MONTHLY_FEE.sql~~ (deleted)  
❌ ~~ADD_UNIT_PRICING_MIGRATION.sql~~ (deleted)  
❌ ~~FLOOR_UNIT_TYPE_CONFIG.sql~~ (not needed)  
❌ ~~UNIT_TEMPLATES_ENHANCEMENT.sql~~ (not needed)  

---

## 🎯 What the Migration Adds

| Feature | Description |
|---------|-------------|
| **Individual Unit Pricing** | Each unit can have its own monthly fee |
| **Updated Unit Types** | Studio, 1BR, 2BR, 3BR, 4BR, Penthouse |
| **Floor Configuration** | Save floor layout as JSON |
| **Revenue Calculations** | Functions to calculate monthly revenue |
| **Unit Templates** | Group similar units together |
| **Management Views** | Easy querying of pricing and occupancy |

---

## 💰 Example Usage

```
Creating "Sunrise Apartments" - 5 Floors

Floor 1:
  - Studio (4 units) → Monthly Fee: 800,000 UGX

Floors 2-5:
  - 1BR (3 units each) → Monthly Fee: 1,200,000 UGX
  - 2BR (2 units each) → Monthly Fee: 1,800,000 UGX

Result:
  Total Units: 24
  Potential Revenue: 40,800,000 UGX/month
```

---

## ✅ Verify Migration Worked

Run this query in Supabase SQL Editor:

```sql
-- Should return: price_ugx | bigint
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'property_units' 
  AND column_name = 'price_ugx';
```

---

## 📊 Useful Queries After Migration

```sql
-- View all unit prices
SELECT * FROM unit_pricing_summary LIMIT 10;

-- Calculate property revenue (replace UUID)
SELECT * FROM calculate_property_revenue_potential('your-property-uuid');

-- Calculate block revenue (replace UUID)
SELECT * FROM calculate_block_revenue_potential('your-block-uuid');

-- See floor configurations
SELECT * FROM property_floor_config_summary;
```

---

## 🎨 UI Preview

When creating an apartment, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ Floor 1 Configuration                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────┐       │
│ │ 1BR  [-] 2 [+]  2 units         [Remove]   │       │
│ │ Monthly Fee (UGX): [1200000] 1,200,000 UGX │  ⭐   │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ ┌─────────────────────────────────────────────┐       │
│ │ 2BR  [-] 1 [+]  1 unit          [Remove]   │       │
│ │ Monthly Fee (UGX): [1800000] 1,800,000 UGX │  ⭐   │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ [+ Add Another Unit Type]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Column already exists" | Normal - migration uses IF NOT EXISTS |
| "Constraint violation" | Migration updates constraints automatically |
| "Can't see monthly fee" | Category must be "Apartment" |
| "Prices show as 0" | Run migration script first |

---

## 📚 Full Documentation

For detailed information, see:
- `FINAL_MONTHLY_FEE_IMPLEMENTATION.md` - Complete guide
- `MIGRATION_ORDER_GUIDE.md` - Migration instructions
- `UNIT_MONTHLY_FEE_FEATURE.md` - Feature details

---

## ✨ You're Done!

1. ✅ Run the one SQL migration
2. ✅ Create an apartment property
3. ✅ Set monthly fees for each unit type
4. ✅ Save and manage your properties

**That's it!** 🎉

---

**Quick Help:**
- Migration file: `scripts/CONSOLIDATED_APARTMENT_FEATURES_MIGRATION.sql`
- Test page: `/admin/properties`
- Category: Must select "Apartment"
- Input: Enter fees as whole numbers (e.g., 1000000)
