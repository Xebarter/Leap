# Unit Template System

## Overview

The Unit Template System ensures that similar units within a building block share the same details and pricing. This enhancement provides:

- **Consistent Pricing**: All units of the same type automatically share the same price
- **Bulk Updates**: Update multiple similar units at once
- **Template-Based Management**: Group units by their characteristics (bedrooms, bathrooms, type)
- **Automatic Synchronization**: Changes to one unit propagate to all similar units

## Database Schema

### New Columns in `property_units` Table

```sql
- unit_type: TEXT - Type of unit (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse, etc.)
- price_ugx: BIGINT - Price in Ugandan Shillings (in cents)
- area_sqft: INTEGER - Area in square feet
- template_name: TEXT - Unique identifier for grouping similar units
- features: TEXT[] - Array of features/amenities
```

### Database Trigger

The `sync_similar_units()` trigger automatically synchronizes unit details when a unit with a template_name is updated:

```sql
-- When updating a unit with a template_name, all other units 
-- with the same template_name in the same block are updated
CREATE TRIGGER trigger_sync_similar_units
  AFTER UPDATE ON public.property_units
  ...
```

## How It Works

### 1. Template Assignment

When units are created, they are assigned a `template_name` based on their characteristics:

```typescript
const templateName = `Standard_${bedrooms}BR_${bathrooms}BA`;
```

Example: A 2-bedroom, 2-bathroom unit gets the template name: `Standard_2BR_2BA`

### 2. Automatic Synchronization

When you update any unit field (bedrooms, bathrooms, price, area, etc.), the database trigger automatically updates all other units with the same `template_name` in the same block.

### 3. Bulk Editing Interface

The `UnitBulkEditor` component provides a UI for managing unit templates:

```tsx
import { UnitBulkEditor } from '@/components/adminView/unit-bulk-editor'

<UnitBulkEditor blockId={blockId} onUpdate={handleUpdate} />
```

## Usage Examples

### Creating Units with Templates

```typescript
// Units created through the property manager automatically get template names
await supabase.from('property_units').insert({
  property_id: propertyId,
  block_id: blockId,
  floor_number: 1,
  unit_number: '101',
  unit_type: 'Standard',
  bedrooms: 2,
  bathrooms: 2,
  price_ugx: 1000000 * 100, // 1,000,000 UGX in cents
  template_name: 'Standard_2BR_2BA',
  is_available: true
});
```

### Updating Similar Units

When you update one unit:

```typescript
// Update unit 101
await supabase.from('property_units')
  .update({ price_ugx: 1200000 * 100 })
  .eq('id', unit101Id);

// All units with the same template_name in the same block 
// are automatically updated (102, 201, 202, etc.)
```

### Building Configuration Form

The `BuildingConfigurationForm` now includes:

1. **Property Templates Tab**: Define different property types (Studio, 1BR, 2BR, etc.)
2. **Units Tab**: Assign specific units to property templates
3. **Visual Feedback**: See which units belong to which template with color coding

```tsx
import { BuildingConfigurationForm } from '@/components/adminView/building-configuration-form'

<BuildingConfigurationForm
  onChange={handleConfigChange}
  propertyPrice={1000000}
  propertyBedrooms={2}
  propertyBathrooms={2}
/>
```

## Key Features

### 1. Template-Based Pricing
- All units of the same type share the same price
- Update once, apply to all similar units
- Visual indicator shows how many units will be affected

### 2. Bulk Editor
- View all unit templates in a block
- Edit properties (bedrooms, bathrooms, price, area)
- See unit count and availability status
- Update all units with one click

### 3. Visual Building Interface
- Color-coded units by type
- Floor-by-floor visualization
- Quick assignment of units to templates

## Migration Guide

### Running the Migration

```bash
# Apply the database migration
psql -d your_database -f scripts/UNIT_TEMPLATES_ENHANCEMENT.sql
```

### Updating Existing Properties

The migration includes an automatic migration script that:
1. Assigns template names to existing units based on their characteristics
2. Groups similar units together
3. Preserves all existing data

### For Existing Units Without Templates

```sql
-- Manually assign template names to existing units
UPDATE property_units
SET template_name = unit_type || '_' || bedrooms || 'BR_' || bathrooms || 'BA'
WHERE template_name IS NULL;
```

## Admin Interface Integration

### Adding the Bulk Editor to Admin Pages

```tsx
// app/(dashboard)/admin/properties/page.tsx
import { UnitBulkEditor } from '@/components/adminView/unit-bulk-editor'

export default function PropertiesPage() {
  return (
    <div>
      {/* Your existing property management UI */}
      
      <Tabs>
        <TabsList>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="bulk-edit">Bulk Edit Units</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bulk-edit">
          <UnitBulkEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Benefits

### For Administrators
- **Time Saving**: Update dozens of units at once
- **Consistency**: Ensure pricing is uniform across similar units
- **Error Prevention**: Automatic synchronization prevents inconsistencies
- **Clear Organization**: See units grouped by type

### For Tenants
- **Fair Pricing**: Similar units have the same price
- **Transparency**: Clear understanding of pricing structure
- **Better Comparison**: Easy to compare similar units

## Troubleshooting

### Units Not Syncing

If units are not syncing after updates:

1. Check that units have the same `template_name`
2. Verify they are in the same `block_id`
3. Check database trigger is enabled:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_similar_units';
```

### Missing Template Names

If units don't have template names:

```sql
-- Assign template names based on characteristics
UPDATE property_units
SET template_name = unit_type || '_' || bedrooms || 'BR_' || bathrooms || 'BA'
WHERE (template_name IS NULL OR template_name = '')
AND block_id IS NOT NULL;
```

### Performance Considerations

For blocks with many units (100+):
- The trigger updates units in bulk, which is efficient
- Consider adding an index on `(block_id, template_name)` if not present
- The update operation is atomic and consistent

## API Reference

### View: `unit_templates_summary`

Returns aggregated information about unit templates:

```sql
SELECT * FROM unit_templates_summary WHERE block_id = 'your-block-id';
```

Returns:
- `block_id`: Block identifier
- `template_name`: Template identifier
- `unit_type`: Type of unit
- `bedrooms`: Number of bedrooms
- `bathrooms`: Number of bathrooms
- `price_ugx`: Price in cents
- `area_sqft`: Area in square feet
- `total_units`: Total units with this template
- `available_units`: Available units count
- `unit_numbers`: Array of unit numbers

### Function: `sync_similar_units()`

Automatically called by the trigger when a unit is updated. Can also be called manually if needed.

## Future Enhancements

Potential improvements:
1. **Template Presets**: Save commonly used templates
2. **Pricing Rules**: Apply percentage increases by floor
3. **Seasonal Pricing**: Template-based pricing variations
4. **Template Cloning**: Copy templates across blocks
5. **Reporting**: Analytics on unit template utilization

## Support

For issues or questions:
1. Check the database logs for trigger errors
2. Verify schema is up to date
3. Ensure RLS policies allow updates
4. Review the migration script for any failures
