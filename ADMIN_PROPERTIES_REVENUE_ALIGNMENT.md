# Admin Properties Page - Revenue Card Alignment

## Issue
The `/admin/properties` page was showing outdated statistics (bookings, confirmed/pending) instead of the proper revenue metrics that are displayed on the `/admin` dashboard.

## Root Cause
The two admin pages had diverged in their implementation:

| Page | Stats Displayed | Data Source |
|------|----------------|-------------|
| `/admin` | Total Revenue, Occupancies, Landlords | Payment transactions from last 6 months |
| `/admin/properties` | Total Bookings, Confirmed, Pending | Old bookings table (deprecated) |

The `AdminStats` component was updated to show revenue metrics, but the `/admin/properties` page wasn't updated to match.

## Solution

### Updated `/admin/properties` Page to Match `/admin` Dashboard

**1. Added Admin Client Import**
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
```

**2. Removed Deprecated Bookings Queries**
- Removed fetching from `bookings` table
- Removed `confirmedBookings` and `pendingBookings` calculations

**3. Added Revenue Calculation Logic**
Implemented the same revenue calculation as `/admin` page:
```typescript
// Fetch revenue data for last 6 months
const revenueResult = await adminClient
  .from("payment_transactions")
  .select("amount_ugx, created_at, status")
  .eq("status", "completed")
  .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())

// Calculate total revenue
const revenueByMonth: Record<string, number> = {};
if (revenueResult.data) {
  for (const transaction of revenueResult.data) {
    if (transaction.amount_ugx && transaction.status === 'completed') {
      const month = new Date(transaction.created_at).toLocaleString('en', { month: 'short' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + transaction.amount_ugx;
    }
  }
}
const totalRevenue = Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0);
```

**4. Added Missing Stats Queries**
Now fetches the same data as `/admin` dashboard:
- Active occupancies count
- Total users (non-admin profiles)
- Landlord profiles count
- Payment transactions for revenue

**5. Updated AdminStats Component Props**
Changed from old signature:
```typescript
<AdminStats 
  totalProperties={propertiesResult.count || 0} 
  totalBookings={bookingsResult.count || 0} 
  totalUsers={usersResult.count || 0}
  confirmedBookings={confirmedBookings}
  pendingBookings={pendingBookings}
/>
```

To new signature (matching `/admin` page):
```typescript
<AdminStats 
  totalProperties={totalProperties}
  availableProperties={availableProperties}
  occupiedProperties={occupiedProperties}
  totalUsers={totalUsers}
  activeOccupancies={activeOccupancies}
  totalRevenue={totalRevenue}
  totalLandlords={totalLandlords}
/>
```

**6. Enhanced Property Fetching**
- Now includes `include_inactive=true` parameter
- Uses `cache: 'no-store'` for real-time data
- Consistent with `/admin` dashboard

## Changes Made

### Files Modified

**`app/(dashboard)/admin/properties/page.tsx`**
- Added `createAdminClient` import
- Removed bookings-related queries and logic
- Added occupancies, revenue, and landlords queries
- Implemented revenue calculation from payment transactions
- Updated `AdminStats` component props
- Calculate available/occupied properties from fetched data

## Benefits

✅ **Consistency**: Both admin pages now show identical statistics  
✅ **Accuracy**: Revenue based on actual payment transactions  
✅ **Real-time**: Tracks active occupancies instead of deprecated bookings  
✅ **Complete**: Shows all 7 key metrics across both pages  
✅ **Maintainability**: Single source of truth for calculations

## Statistics Now Displayed (Both Pages)

### 1. Total Properties Card
- Total count (all properties including inactive)
- Available count
- Occupied count  
- Occupancy rate percentage

### 2. Total Revenue Card
- Sum of completed payment transactions (last 6 months)
- Displayed in UGX with proper formatting
- "Last 6 months" timeframe indicator
- Trending indicator

### 3. Active Tenants Card
- Total registered users (non-admin)
- Active occupancies count

### 4. Landlords Card
- Total landlord profiles count

## Data Consistency

| Metric | Source Table | Calculation |
|--------|-------------|-------------|
| Total Properties | `properties` (via API) | `allProperties.length` |
| Available Properties | `properties` | `filter(p => !p.is_occupied).length` |
| Occupied Properties | `properties` | `filter(p => p.is_occupied).length` |
| Occupancy Rate | Calculated | `(occupied / total) * 100` |
| Total Revenue | `payment_transactions` | Sum of `amount_ugx` where `status = 'completed'` (last 6 months) |
| Active Tenants | `profiles` | Count where `is_admin = false` |
| Active Occupancies | `property_occupancy_history` | Count where `status = 'active'` |
| Total Landlords | `landlord_profiles` | Total count |

## Before vs After

### Before (Admin Properties Page)
```
┌──────────────────────────────────────┐
│ Total Properties            15       │
│ Total Bookings              0        │ ❌ Deprecated
│ Total Users                 42       │
│ Confirmed Bookings          0        │ ❌ Deprecated
│ Pending Bookings            0        │ ❌ Deprecated
└──────────────────────────────────────┘
```

### After (Admin Properties Page)
```
┌──────────────────────────────────────┐
│ Total Properties            15       │
│ 8 available · 7 occupied             │ ✅ Real data
│ 47% occupancy rate                   │ ✅ Calculated
│                                      │
│ Total Revenue      UGX 45,000,000    │ ✅ From transactions
│ Last 6 months                        │
│                                      │
│ Active Tenants              42       │ ✅ Real users
│ 7 active occupancies                 │ ✅ Current occupancies
│                                      │
│ Landlords                   5        │ ✅ Landlord count
└──────────────────────────────────────┘
```

## Testing Checklist

- [x] Build succeeds without errors
- [x] `/admin` page shows correct revenue
- [x] `/admin/properties` page shows correct revenue
- [x] Both pages show identical statistics
- [x] Revenue calculated from payment_transactions table
- [x] Occupancy rate displays correctly
- [x] All 7 metrics display on both pages
- [x] No TypeScript errors

## Performance Notes

- Uses admin client to bypass RLS (faster queries)
- Parallel queries with `Promise.all()` for efficiency
- Revenue calculation happens server-side
- Minimal overhead from transaction aggregation

## Migration Notes

No database migrations required - this is purely a code change to align both pages.

---

**Status**: ✅ Completed and Tested  
**Build**: ✅ Passing  
**Consistency**: ✅ Both pages aligned  
**Deployment**: Ready for production
