# Quick Start: Floor-Based Unit Configuration

## For Administrators

### Step 1: Run Database Migration
First, apply the database schema changes:

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/FLOOR_UNIT_TYPE_CONFIG.sql`
4. Click "Run" to execute the migration

### Step 2: Create an Apartment Property

1. Go to `/admin/properties` page
2. Click **"Add Property"** button
3. Select **"Apartment"** as the category
4. Fill in basic information (title, location, description)
5. Set the **Number of Floors** (e.g., 5 floors)

### Step 3: Configure Units Per Floor

**Simple Mode (Recommended):**

1. Leave the "Use advanced configuration" checkbox **unchecked**
2. You'll see the **Floor Unit Type Configurator**
3. Use the floor selector to navigate between floors
4. For each floor:
   - Click "Add Unit Type" dropdown
   - Select a unit type (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse)
   - Adjust the count using +/- buttons or direct input
   - Add multiple unit types if needed

**Quick Actions:**
- **Copy from Floor X**: Copy configuration from another floor
- **Apply to All**: Apply current floor's configuration to all floors

### Step 4: Visual Verification

- Check the **building preview** to see your configuration
- View **unit type distribution** statistics at the top
- See **total units** count

### Step 5: Complete Property Setup

1. Upload property images
2. Set the main property image
3. Add video URL (optional)
4. Configure block association (optional)
5. Click **"Create Property"**

### Result

✅ Property is created with all units automatically generated
✅ Each unit has correct bedroom/bathroom counts based on type
✅ Units are numbered sequentially (101, 102, 201, 202, etc.)
✅ Interactive building visualization appears on public property page

## Example Configuration

**Building:** 5-Story Apartment Building

**Floor 1 (Ground):** 
- 2× Studio apartments
- 1× 1BR apartment

**Floor 2-4 (Typical):**
- 2× 1BR apartments
- 2× 2BR apartments

**Floor 5 (Top):**
- 1× 3BR apartment
- 1× Penthouse

**Total Units:** 14 apartments

## For Developers

### Using the Component

```tsx
import { FloorUnitTypeConfigurator } from '@/components/adminView/floor-unit-type-configurator'

function MyForm() {
  const [config, setConfig] = useState(null)
  
  return (
    <FloorUnitTypeConfigurator
      totalFloors={5}
      onChange={setConfig}
    />
  )
}
```

### Configuration Structure

```typescript
interface FloorUnitTypeConfiguration {
  totalFloors: number
  floors: Array<{
    floorNumber: number
    unitTypes: Array<{
      type: string  // 'Studio', '1BR', '2BR', '3BR', '4BR', 'Penthouse'
      count: number // How many units of this type
    }>
  }>
}
```

### Displaying the Visualization

```tsx
import { BuildingBlockVisualization } from '@/components/publicView/building-block-visualization'

<BuildingBlockVisualization
  buildingName="Kampala Heights"
  totalFloors={5}
  units={actualUnits}
  floorUnitConfig={property.floor_unit_config}
  currentPropertyId={propertyId}
/>
```

## Troubleshooting

### Units not appearing in database
- Check that `floor_unit_config` column exists in `properties` table
- Verify the migration was run successfully
- Check browser console for errors

### Unit types not saving
- Ensure `unit_type` constraint includes apartment types (1BR, 2BR, etc.)
- Run the constraint update from the migration script

### Building visualization not showing
- Verify `floorUnitConfig` prop is passed to BuildingBlockVisualization
- Check that property has `floor_unit_config` data
- Open browser console to check for errors

### Configuration not copying between floors
- This is a client-side operation - no server error
- Check browser console for JavaScript errors
- Ensure React state is updating correctly

## Tips

1. **Start with one floor**: Configure Floor 1 completely, then use "Apply to All"
2. **Use Copy feature**: For buildings with similar floors, configure one and copy
3. **Visual feedback**: Always check the building preview before saving
4. **Unit numbering**: Units are numbered automatically - Floor 1: 101, 102, Floor 2: 201, 202
5. **Edit anytime**: You can edit the property later to change unit configuration

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database migration was applied
3. Review `FLOOR_UNIT_TYPE_FEATURE_SUMMARY.md` for technical details
4. Check that you're using the correct category ("Apartment")
