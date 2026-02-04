# Building Edit Button Fix - Summary

## Issue
When clicking the "Edit" button on any building in the /admin/buildings page, all buildings would open the same building (NSSF Pension towers) for editing, regardless of which building's edit button was clicked.

## Root Cause
The issue was in the data fetching logic:

1. **Buildings Manager Component**: The edit button correctly passed the building's ID to the edit page URL
2. **Edit Page**: The page correctly received the blockId parameter from the URL
3. **ApartmentEditor Component**: This component fetched data using the API endpoint: 
   \/api/properties?block_id=\\
4. **API Route Problem**: The GET endpoint in \/api/properties/route.ts\ did NOT support the \lock_id\ query parameter. It simply returned ALL active properties and ignored the block_id filter.
5. **Result**: The ApartmentEditor would receive all properties and just use the first one (line 140), which was always NSSF Pension towers.

## Solution
Modified the \/api/properties/route.ts\ GET endpoint to:

1. Parse the \lock_id\ query parameter from the URL
2. When \lock_id\ is provided, filter properties by that specific block_id
3. When \lock_id\ is NOT provided, return all active properties (public view behavior)

### Code Changes
**File**: \pp/api/properties/route.ts\

Added query parameter parsing and conditional filtering:
\\\	ypescript
// Parse URL parameters
const { searchParams } = new URL(request.url)
const blockId = searchParams.get('block_id')

// Build query with optional block_id filter
let query = supabaseAdmin.from('properties').select(...)

// Apply filters
if (blockId) {
  // If block_id is provided, fetch properties for that specific block (for editing)
  query = query.eq('block_id', blockId)
} else {
  // Otherwise, only fetch active properties for public view
  query = query.eq('is_active', true)
}
\\\

## Testing
To verify the fix:
1. Navigate to /admin/buildings
2. Click "Edit" on different buildings
3. Verify that each building opens its own edit page with the correct data
4. Check that the building name, location, floors, and unit types match the selected building

## Files Modified
- app/api/properties/route.ts

## Status
✅ Fixed and ready for testing
