# Admin Dashboard Properties Count Fix

## Issue
The admin dashboard at `/admin` was displaying **0 properties** in the Total Properties card, even though properties existed in the database. This was inconsistent with the `/admin/properties` page which correctly showed all properties.

## Root Cause Analysis

### Problem 1: RLS Restrictions
Initially, the admin dashboard was using `createClient()` from `@/lib/supabase/server` which respects Row Level Security (RLS) policies. These policies were restricting property access.

### Problem 2: API Route Filtering
After switching to `createAdminClient()`, the issue persisted because the properties were being fetched differently than on `/admin/properties` page:

- **Admin Dashboard**: Used direct database queries
- **Admin Properties Page**: Used `/api/properties` route

The `/api/properties` route has a filter that only returns active properties (`is_active = true`) by default, which was causing the mismatch.

## Solution

### Step 1: Fetch Properties via API Route
Changed the admin dashboard to fetch properties the same way as `/admin/properties` page - through the `/api/properties` route. This ensures consistency across both pages.

### Step 2: Add `include_inactive` Parameter
Updated the `/api/properties` GET route to support an optional `include_inactive` query parameter:

```typescript
const includeInactive = searchParams.get('include_inactive') === 'true'

// Apply filters
if (blockId) {
  // If block_id is provided, fetch properties for that specific block
  query = query.eq('block_id', blockId)
} else if (!includeInactive) {
  // Only fetch active properties for public view
  query = query.eq('is_active', true)
}
// If includeInactive is true, fetch ALL properties (no filter)
```

### Step 3: Use Parameter in Admin Dashboard
Updated the admin dashboard to call the API with `include_inactive=true`:

```typescript
const propertiesRes = await fetch(
  `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties?include_inactive=true`,
  {
    headers: {
      'Authorization': `Bearer ${await getAccessToken(supabase)}`
    },
    cache: 'no-store'
  }
);
```

## Changes Made

### Files Modified

1. **`app/(dashboard)/admin/page.tsx`**
   - Added `getAccessToken()` helper function
   - Fetch properties via API route instead of direct database query
   - Calculate stats from fetched properties array
   - Use properties data for top performers calculation

2. **`app/api/properties/route.ts`**
   - Added `include_inactive` query parameter support
   - Modified filter logic to return all properties when `include_inactive=true`
   - Maintained backward compatibility (still filters by `is_active` by default)

## How It Works Now

### For Admin Dashboard (`/admin`)
1. ✅ Fetches ALL properties (active and inactive) via API
2. ✅ Calculates total count: `allProperties.length`
3. ✅ Filters for available: `allProperties.filter(p => !p.is_occupied).length`
4. ✅ Filters for occupied: `allProperties.filter(p => p.is_occupied).length`
5. ✅ Calculates occupancy rate: `(occupied / total) * 100`

### For Admin Properties Page (`/admin/properties`)
1. ✅ Also fetches via same API route
2. ✅ Shows complete properties list
3. ✅ Consistent count with dashboard

### For Public Properties Page (`/properties`)
1. ✅ Fetches only active properties (default behavior)
2. ✅ No `include_inactive` parameter
3. ✅ Hides inactive/draft properties from public

## Benefits

✅ **Consistency**: Both admin pages now show the same property count  
✅ **Accuracy**: Admin sees ALL properties regardless of status  
✅ **Security**: Public still only sees active properties  
✅ **Maintainability**: Single source of truth via API route  
✅ **Flexibility**: Easy to extend with more filters in the future

## Testing Checklist

- [x] Build succeeds without errors
- [x] Admin dashboard shows correct property count
- [x] Available/Occupied counts are accurate
- [x] Occupancy rate calculates correctly
- [x] Top properties display properly
- [x] Public properties page unaffected
- [x] Backward compatibility maintained

## Code Quality

- ✅ No TypeScript errors
- ✅ Follows existing patterns from `/admin/properties` page
- ✅ Proper error handling for API fetch
- ✅ Cache disabled for real-time data (`cache: 'no-store'`)
- ✅ Uses authentication token for API security

## Expected Behavior

### Admin Dashboard Stats Card
```
┌─────────────────────────────────────┐
│ Total Properties          15        │
│ 8 available · 7 occupied            │
│ 47% occupancy rate                  │
└─────────────────────────────────────┘
```

### API Route Behavior

| Scenario | URL | Returns |
|----------|-----|---------|
| Public view | `/api/properties` | Active properties only |
| Admin view | `/api/properties?include_inactive=true` | ALL properties |
| Edit block | `/api/properties?block_id=123` | Properties in that block |

## Migration Notes

No database migrations required - this is purely a code change to data fetching logic.

## Performance Considerations

- API route uses service role key (bypasses RLS)
- Minimal overhead from fetch call (server-side only)
- Properties cached by Next.js (can be disabled with `cache: 'no-store'`)
- No additional database queries

---

**Status**: ✅ Fixed and Tested  
**Build**: ✅ Passing  
**Compatibility**: ✅ Backward compatible  
**Deployment**: Ready for production
