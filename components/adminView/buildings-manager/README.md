# Buildings Manager Component

## Overview
The Buildings Manager is a comprehensive admin interface for managing apartment buildings, their unit types, and individual units.

## Features

### 1. **Dashboard Statistics**
- Total Buildings count
- Total Units across all buildings
- Available Units (vacant)
- Occupied Units with occupancy rate

### 2. **Buildings List View**
- **Grid View**: Card-based layout with building images and quick stats
- **List View**: Detailed table-style layout with comprehensive information
- Real-time statistics for each building

### 3. **Search & Filters**
- Text search by building name or location
- Location-based filtering
- Instant results without page reload

### 4. **Building Management**
- **Create**: Redirect to apartment creation wizard
- **Edit**: Opens the existing ApartmentEditor for full building configuration
- **Delete**: Safe deletion with confirmation dialog
- **View Details**: Detailed modal with tabs for overview, units, and properties

### 5. **Building Details Dialog**
Comprehensive view with three tabs:
- **Overview**: Statistics, description, unit types, price range
- **Units**: All individual units with floor, type, and availability status
- **Properties**: All property listings (unit types) with images and pricing

## Usage

### Page Route
```
/admin/buildings
```

### API Endpoints
```
GET  /api/admin/buildings?search={query}&location={location}
DELETE /api/admin/buildings?id={blockId}
```

## Data Flow

1. **Fetch Buildings**: API route queries `property_blocks` table
2. **Enrich Data**: For each block, fetch:
   - All properties (unit type listings)
   - All units (individual apartments)
   - Calculate statistics (occupancy, availability, price ranges)
3. **Display**: Render in grid or list view with filters
4. **Actions**: Edit (redirect to ApartmentEditor), Delete, View Details

## Database Schema

### property_blocks
- `id`: UUID (Primary Key)
- `name`: Building name
- `location`: Building address
- `total_floors`: Number of floors
- `total_units`: Total unit count
- `block_image_url`: Featured image

### properties
- Linked via `block_id` (foreign key to property_blocks)
- Represents unit types (e.g., "1BR", "2BR")
- Each property is a separate listing

### property_units
- Linked via `block_id` (foreign key to property_blocks)
- Individual apartments within the building
- Has `is_available` flag for occupancy tracking

## Integration

### Sidebar Navigation
Added to `admin-sidebar.tsx`:
```tsx
{
  href: "/admin/buildings",
  label: "Buildings",
  icon: Building2
}
```

### Relationship with ApartmentEditor
- Uses the existing `ApartmentEditor` component for editing
- Navigates to `/admin/properties/apartment/{blockId}/edit`
- Reuses all apartment creation/editing logic

## Statistics Calculation

For each building:
- **Total Units**: Count from `property_units` table
- **Available Units**: Count where `is_available = true`
- **Occupied Units**: Total - Available
- **Occupancy Rate**: (Occupied / Total) * 100
- **Unit Types**: Unique bedrooms configurations
- **Price Range**: Min and max from all properties in the block

## Future Enhancements

1. **Bulk Operations**: Select multiple buildings for batch actions
2. **Export**: Export building data to CSV/PDF
3. **Analytics**: Occupancy trends over time
4. **Images Gallery**: Manage multiple images per building
5. **Floor Plans**: Upload and display floor plan diagrams
6. **Sorting**: Sort by name, location, occupancy, price
7. **Advanced Filters**: Filter by occupancy rate, price range, number of floors
8. **Quick Actions**: Inline editing of basic info without full editor
