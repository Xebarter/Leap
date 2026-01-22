# Flexible Unit System - Template Synced & Individual Units

## Overview

The enhanced unit system now supports **two modes** for managing units:

1. **🔗 Template-Synced Units**: Units that automatically share the same details and pricing
2. **⚡ Individual Units**: Units with unique, independent pricing and details

This gives you complete flexibility to manage both standardized and custom units within the same building.

---

## Two Types of Units

### 🔗 Template-Synced Units (Default)

**When to use:**
- Multiple identical units (e.g., all 2BR apartments on different floors)
- Standardized pricing across similar units
- Bulk updates needed for unit types

**Behavior:**
- Grouped by template (e.g., `Standard_2BR_2BA`)
- Update one = updates all similar units in the block
- Synchronized: bedrooms, bathrooms, price, area, type, features
- Database trigger enforces consistency

**Example:**
```
Units 101, 102, 201, 202 → All 2BR/2BA, all 1,000,000 UGX
Update Unit 101 to 1,200,000 UGX
→ Units 102, 201, 202 automatically become 1,200,000 UGX
```

### ⚡ Individual Units

**When to use:**
- Premium units with unique features
- Units with different views or positions
- Custom pricing strategies (corner units, top floor, etc.)
- One-off special configurations

**Behavior:**
- Each unit has independent settings
- Updates affect only that specific unit
- No automatic synchronization
- Full control over individual pricing

**Example:**
```
Unit 301 → Penthouse, 3BR/3BA, 2,500,000 UGX (Individual)
Unit 302 → Corner unit, 2BR/2BA, 1,500,000 UGX (Individual)
Units 101-202 → Standard 2BR/2BA, 1,000,000 UGX (Synced Template)
```

---

## How to Use

### Creating Units

**Step 1: Configure Building**
In the Building Configuration Form, units are created as template-synced by default.

```tsx
// Default: Synced units
{
  unitNumber: '101',
  floor: 1,
  templateId: 'template-id',
  syncWithTemplate: true  // Default
}
```

**Step 2: Toggle Individual Mode**
Click the "🔗 Synced" button on any unit to convert it to "⚡ Individual" mode.

### Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| 🔗 Synced | Unit syncs with template (updates affect all similar units) |
| ⚡ Individual | Unit has independent settings (updates affect only this unit) |

---

## User Interface

### Building Configuration Form

**Features:**
- Toggle button on each unit: "🔗 Synced" ↔ "⚡ Individual"
- Visual feedback showing template grouping
- Color-coded unit types
- Unit count per template

**Actions:**
1. Select a unit in the Units tab
2. Click "🔗 Synced" to toggle to "⚡ Individual"
3. Individual units are highlighted differently

### Unit Bulk Editor

**Two Tabs:**

#### Tab 1: 🔗 Template Units
- View all synced unit templates
- Edit properties (updates all synced units in that template)
- Shows: `X synced • Y total • Z available`
- Bulk update button affects all synced units

#### Tab 2: ⚡ Individual Units  
- View all individual units
- Edit each unit independently
- Amber/yellow background for visual distinction
- Update button affects only that specific unit

**Usage:**
```tsx
import { UnitBulkEditor } from '@/components/adminView/unit-bulk-editor'

<UnitBulkEditor blockId={blockId} onUpdate={handleRefresh} />
```

---

## Database Schema

### New Column: `sync_with_template`

```sql
ALTER TABLE property_units 
ADD COLUMN sync_with_template BOOLEAN DEFAULT TRUE;
```

**Values:**
- `TRUE` (default): Unit syncs with template
- `FALSE`: Unit has individual settings

### Updated Trigger Logic

```sql
-- Only syncs units where sync_with_template = TRUE
IF NEW.sync_with_template = TRUE THEN
  UPDATE property_units
  SET ...
  WHERE 
    template_name = NEW.template_name
    AND sync_with_template = TRUE  -- Only sync opted-in units
    AND id != NEW.id;
END IF;
```

### New View: `individual_units_summary`

```sql
CREATE VIEW individual_units_summary AS
SELECT 
  id, unit_number, floor_number, bedrooms, bathrooms,
  price_ugx, area_sqft, is_available, ...
FROM property_units
WHERE sync_with_template = FALSE OR template_name IS NULL;
```

---

## Use Cases

### Use Case 1: Standard Apartments with Premium Penthouse

**Scenario:** 
- Floors 1-5: Standard 2BR apartments (all same price)
- Floor 6: Luxury penthouse units (individual pricing)

**Setup:**
```
Units 101-502: 🔗 Synced (Standard_2BR_2BA) → 1,000,000 UGX
Unit 601: ⚡ Individual (Penthouse) → 3,000,000 UGX
Unit 602: ⚡ Individual (Corner Penthouse) → 3,500,000 UGX
```

**Result:**
- Update standard price once → affects 50 units
- Penthouse pricing remains independent

### Use Case 2: Mixed Unit Types in Same Building

**Scenario:**
- Studios, 1BR, 2BR, and 3BR units
- Each type has standard pricing
- Some units have special features

**Setup:**
```
Studios (10 units): 🔗 Synced → 600,000 UGX
1BR (15 units): 🔗 Synced → 900,000 UGX
2BR (20 units): 🔗 Synced → 1,200,000 UGX
2BR Corner (4 units): ⚡ Individual → 1,400,000 UGX each
3BR (8 units): 🔗 Synced → 1,800,000 UGX
```

**Benefits:**
- Easy bulk price updates per unit type
- Flexible premium pricing for special units

### Use Case 3: Seasonal or Promotional Pricing

**Scenario:**
- Convert specific units to individual mode for promotions
- Offer discounts without affecting other units

**Setup:**
```
Units 101-110: 🔗 Synced → 1,000,000 UGX
Unit 105: Toggle to ⚡ Individual → 850,000 UGX (promotion)
Units 106-110: Remain 🔗 Synced → 1,000,000 UGX
```

**Result:**
- Unit 105 has promotional pricing
- Other units maintain standard pricing

---

## Workflows

### Workflow 1: Create Building with Standard Units

1. Open Property Manager → Add Property
2. Configure building (name, floors, units)
3. Create property templates (1BR, 2BR, etc.)
4. Assign units to templates
5. All units are synced by default ✅

### Workflow 2: Convert Unit to Individual Pricing

1. Go to Building Configuration Form
2. Navigate to Units tab
3. Find the unit you want to customize
4. Click "🔗 Synced" button → changes to "⚡ Individual"
5. Unit now has independent settings ✅

### Workflow 3: Bulk Update Standard Units

1. Open Unit Bulk Editor
2. Go to "🔗 Template Units" tab
3. Find the template (e.g., Standard_2BR_2BA)
4. Update price, bedrooms, bathrooms, or area
5. Click "Update All X Synced Units"
6. All synced units in that template update ✅

### Workflow 4: Update Individual Unit

1. Open Unit Bulk Editor
2. Go to "⚡ Individual Units" tab
3. Find the specific unit
4. Update its unique details
5. Click "Update This Unit Only"
6. Only that unit is updated ✅

---

## Key Features

### ✅ Flexibility
- Start with synced units for consistency
- Convert to individual as needed
- Mix both types in same building

### ✅ Control
- Explicit toggle for each unit
- Clear visual indicators
- Separate tabs for different modes

### ✅ Efficiency
- Bulk updates for standard units
- Individual updates for custom units
- No unnecessary synchronization

### ✅ Safety
- Database-enforced consistency
- Only synced units are affected by template updates
- Individual units are protected from bulk changes

---

## Best Practices

### 1. Default to Synced
Start with template-synced units for consistency. Convert to individual only when needed.

### 2. Clear Naming
Use descriptive template names:
- `Standard_2BR_2BA` (clear and searchable)
- `Deluxe_3BR_2.5BA` (indicates premium tier)
- `Studio_OpenPlan` (describes layout)

### 3. Strategic Individual Units
Convert to individual mode for:
- Corner units (better view)
- Top floor units (premium position)
- Ground floor units (accessibility premium/discount)
- Units with unique features (balcony, extra storage)

### 4. Regular Reviews
Periodically review individual units to ensure pricing is still appropriate.

### 5. Documentation
Keep notes on why specific units have individual pricing (e.g., "Unit 505 - Ocean view premium").

---

## Migration from Old System

### Existing Units
All existing units will have `sync_with_template = TRUE` by default. The migration script automatically:
1. Assigns template names to existing units
2. Groups similar units together
3. Enables synchronization

### Converting Existing Units
To convert existing units to individual mode:

**Option 1: Via UI**
- Use Building Configuration Form
- Toggle "🔗 Synced" to "⚡ Individual"

**Option 2: Via Database**
```sql
UPDATE property_units
SET sync_with_template = FALSE
WHERE unit_number IN ('501', '502', '601');  -- Penthouse units
```

---

## Troubleshooting

### Unit not syncing with template?
**Check:**
- `sync_with_template` is TRUE
- `template_name` matches other units
- Units are in same `block_id`

### Individual unit getting updated with template?
**Fix:**
```sql
UPDATE property_units
SET sync_with_template = FALSE
WHERE id = 'unit-id';
```

### Want to re-sync an individual unit?
**Steps:**
1. Set `sync_with_template = TRUE`
2. Update the unit to match template values
3. Trigger will keep it synced going forward

---

## API Reference

### Toggle Unit Sync Mode

```typescript
// Convert to individual
await supabase
  .from('property_units')
  .update({ sync_with_template: false })
  .eq('id', unitId);

// Convert to synced
await supabase
  .from('property_units')
  .update({ sync_with_template: true })
  .eq('id', unitId);
```

### Query Synced Units

```typescript
const { data } = await supabase
  .from('property_units')
  .select('*')
  .eq('sync_with_template', true)
  .eq('template_name', 'Standard_2BR_2BA');
```

### Query Individual Units

```typescript
const { data } = await supabase
  .from('property_units')
  .select('*')
  .eq('sync_with_template', false);

// Or use the view
const { data } = await supabase
  .from('individual_units_summary')
  .select('*')
  .eq('block_id', blockId);
```

---

## Summary

The flexible unit system provides the best of both worlds:

| Feature | Template-Synced 🔗 | Individual ⚡ |
|---------|-------------------|---------------|
| **Updates** | Affects all similar units | Affects only this unit |
| **Use Case** | Standard units | Custom/premium units |
| **Management** | Bulk editing | Individual editing |
| **Consistency** | Enforced by trigger | User-controlled |
| **Visual** | Grouped in templates | Listed separately |

**Default behavior:** All new units are synced for consistency.  
**Flexibility:** Toggle any unit to individual mode anytime.  
**Control:** You decide which units sync and which are independent.

This system scales from simple buildings with identical units to complex properties with mixed unit types and custom pricing strategies.
