# Unit Monthly Fee Configuration Feature

## Overview
This feature allows administrators to set individual monthly rental fees for each unit type when creating apartment properties. This is particularly useful for buildings with multiple unit types (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse) that have different rental rates.

## Feature Highlights

### 1. **Per-Unit-Type Pricing**
- Set different monthly fees for different unit types (e.g., 1BR: 1,000,000 UGX, 2BR: 1,500,000 UGX)
- Each floor can have multiple unit types with their own pricing
- Visual feedback showing formatted prices in UGX

### 2. **User-Friendly Interface**
- Monthly fee input field appears below each unit type configuration
- Real-time formatting displays the entered amount in a readable format
- Easy to update prices for any unit type on any floor

### 3. **Database Support**
- New `price_ugx` column in `property_units` table stores monthly fees in cents (for precision)
- Updated unit type constraints to support modern unit types (Studio, 1BR, 2BR, 3BR, 4BR, Penthouse)
- Revenue calculation functions for property management analytics

## How to Use

### For Administrators

#### When Creating an Apartment Property:

1. **Select Category**: Choose "Apartment" as the property category
2. **Basic Information**: Fill in title, location, and description
3. **Set Number of Floors**: Use the floor selector to specify building height
4. **Configure Each Floor**:
   - Select a floor from the visual building preview
   - Add unit types (Studio, 1BR, 2BR, etc.)
   - Set the number of units for each type
   - **Set Monthly Fee**: Enter the monthly rental fee in UGX for each unit type
5. **Copy Configuration**: Use "Copy from..." to replicate floor layouts
6. **Apply to All**: Use "Apply to All" to use the same configuration for all floors

#### Example Configuration:

**Floor 1:**
- 2BR (2 units) - Monthly Fee: 1,500,000 UGX
- 3BR (1 unit) - Monthly Fee: 2,000,000 UGX

**Floor 2-5:**
- 1BR (3 units) - Monthly Fee: 1,000,000 UGX
- 2BR (2 units) - Monthly Fee: 1,500,000 UGX

## Database Setup

### Run the Migration Script

Execute the SQL migration to add monthly fee support:

```bash
# Using psql
psql -U your_username -d your_database -f scripts/ADD_UNIT_MONTHLY_FEE.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of scripts/ADD_UNIT_MONTHLY_FEE.sql
```

### What the Migration Does:

1. Adds `price_ugx` column to `property_units` table
2. Updates unit type constraints to support all modern unit types
3. Creates an index on `price_ugx` for performance
4. Migrates existing units to have default pricing
5. Creates a `unit_pricing_summary` view for easy querying
6. Adds a `calculate_block_revenue_potential()` function for analytics

## Technical Details

### Data Structure

#### UnitTypeConfig Interface
```typescript
interface UnitTypeConfig {
  type: string        // e.g., "1BR", "2BR"
  count: number       // How many units of this type
  monthlyFee: number  // Monthly rental fee in UGX
}
```

#### FloorConfig Interface
```typescript
interface FloorConfig {
  floorNumber: number
  unitTypes: UnitTypeConfig[]
}
```

### Database Schema

```sql
-- property_units table
CREATE TABLE property_units (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  block_id UUID REFERENCES property_blocks(id),
  floor_number INTEGER NOT NULL,
  unit_number TEXT NOT NULL,
  unit_type TEXT CHECK (unit_type IN (
    'Standard', 'Deluxe', 'Penthouse', 'Studio', 
    'Bedsitter', '1BR', '2BR', '3BR', '4BR', 'Other'
  )),
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  price_ugx BIGINT DEFAULT 0,  -- NEW: Monthly fee in cents
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Price Storage

Prices are stored in **cents** (UGX * 100) for precision:
- Display: 1,000,000 UGX
- Stored: 100,000,000 (in cents)

## Analytics & Reporting

### Unit Pricing Summary View

Query all unit pricing information:

```sql
SELECT * FROM unit_pricing_summary
WHERE block_name = 'Your Block Name';
```

Returns:
- Unit details (number, type, floor, bedrooms, bathrooms)
- Monthly fee (both in cents and formatted)
- Availability status
- Property and block information

### Revenue Potential Calculation

Calculate potential and current revenue for a block:

```sql
SELECT * FROM calculate_block_revenue_potential('block-uuid-here');
```

Returns:
- Total units count
- Occupied vs available units
- Potential monthly revenue (if all units occupied)
- Current monthly revenue (only occupied units)

## Benefits

1. **Flexible Pricing**: Different rates for different unit types
2. **Accurate Revenue Tracking**: Know exactly what each unit generates
3. **Better Property Management**: Clear pricing structure for tenants
4. **Scalability**: Easy to manage large buildings with many unit types
5. **Financial Planning**: Calculate revenue potential and occupancy impact

## Future Enhancements

Potential features to add:
- Seasonal pricing adjustments
- Discount management (early payment, long-term lease)
- Price history tracking
- Automated price suggestions based on market data
- Bulk price updates

## Support

For issues or questions:
1. Check the database migration ran successfully
2. Verify unit types match the constraint
3. Ensure prices are entered as whole numbers (no decimals)
4. Review the console for any error messages during property creation

## Files Modified

1. `components/adminView/floor-unit-type-configurator.tsx` - UI for setting monthly fees
2. `components/adminView/comprehensive-property-manager.tsx` - Handles saving unit prices
3. `scripts/ADD_UNIT_MONTHLY_FEE.sql` - Database migration script

---

**Version**: 1.0  
**Last Updated**: 2026-01-11  
**Author**: Property Management System Team
