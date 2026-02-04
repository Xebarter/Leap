# Property Occupancy and Payment Period Tracking System

## Overview

This system automatically manages property availability based on payment periods. When a user pays for a property, it disappears from the listing and automatically reappears when the payment period expires (unless extended by admin/landlord).

## Features

✅ **Automatic Property Hiding**: Properties disappear from listings after successful payment
✅ **Payment Period Tracking**: Tracks number of months paid and expiration date
✅ **Auto-Expiry**: Properties automatically become available when period ends
✅ **Manual Extension**: Admins/landlords can extend occupancy periods
✅ **History Tracking**: Complete history of all occupancy periods
✅ **Payment Integration**: Seamlessly integrates with existing payment system

---

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration to add occupancy tracking:

```bash
# Run this SQL file in your Supabase SQL Editor
scripts/ADD_PROPERTY_OCCUPANCY_TRACKING.sql
```

This creates:
- New columns in `properties` table for occupancy tracking
- `property_occupancy_history` table for tracking all occupancy periods
- Database functions for marking properties as occupied/expired
- Indexes for efficient querying

### 2. Set Up Cron Job

The system uses a cron job to automatically expire occupancies. Choose one option:

#### Option A: Vercel Cron (Recommended if using Vercel)

The `vercel.json` file is already configured. Just deploy to Vercel and the cron job will run automatically at midnight daily.

#### Option B: External Cron Service

Use a service like cron-job.org:

1. Create a free account at https://cron-job.org
2. Create a new cron job with:
   - **URL**: `https://your-domain.com/api/cron/expire-occupancies`
   - **Schedule**: `0 0 * * *` (daily at midnight)
   - **Method**: GET
   - **Headers**: 
     - `Authorization: Bearer your-secret-key`

3. Set the `CRON_SECRET` environment variable in your deployment:
   ```
   CRON_SECRET=your-secret-key
   ```

### 3. Update Environment Variables

Add to your `.env.local`:

```env
CRON_SECRET=your-secure-random-secret-key
```

---

## How It Works

### Payment Flow

1. **User Initiates Payment**
   - User clicks "Make Payment" button on property details page
   - Enters amount, phone number, and payment method
   - System passes: `propertyId`, `monthsPaid`, `amount`

2. **Payment Processing**
   - Payment is initiated via `/api/payments/initiate`
   - Transaction is saved with property and months info

3. **Payment Verification**
   - System verifies payment status via `/api/payments/verify`
   - When payment is `completed`, system calls database function:
     ```sql
     mark_property_as_occupied(
       property_id,
       tenant_id,
       months_paid,
       amount_paid,
       transaction_id
     )
     ```

4. **Property Marked as Occupied**
   - Property is marked: `is_occupied = true`
   - Occupancy end date calculated: `NOW() + months_paid`
   - Entry created in `property_occupancy_history`
   - Property immediately disappears from public listings

### Automatic Expiry

1. **Daily Cron Job Runs** (at midnight)
   - Endpoint: `/api/cron/expire-occupancies`
   - Calls database function: `expire_completed_occupancies()`

2. **Function Checks All Occupied Properties**
   - Finds properties where `occupancy_end_date <= NOW()`
   - Marks them as available: `is_occupied = false`
   - Updates history status to `expired`

3. **Property Reappears in Listings**
   - Property is now visible again to prospective tenants

---

## Database Schema

### Properties Table (New Columns)

```sql
is_occupied BOOLEAN DEFAULT FALSE
occupied_by UUID REFERENCES profiles(id)
occupancy_start_date TIMESTAMPTZ
occupancy_end_date TIMESTAMPTZ
paid_months INTEGER DEFAULT 0
last_payment_date TIMESTAMPTZ
can_extend_occupancy BOOLEAN DEFAULT TRUE
```

### Property Occupancy History Table

```sql
CREATE TABLE property_occupancy_history (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES profiles(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  months_paid INTEGER NOT NULL,
  amount_paid_ugx BIGINT NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'extended', 'cancelled')),
  original_end_date TIMESTAMPTZ,
  extended_by UUID REFERENCES profiles(id),
  extension_reason TEXT,
  extended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Admin/Landlord Functions

### Extending Occupancy Period

Admins and landlords can manually extend a property's occupancy period:

```sql
SELECT extend_property_occupancy(
  'property-id-uuid',
  3,  -- additional months
  'admin-user-id-uuid',
  'Tenant requested extension and paid via bank transfer'
);
```

### Viewing Occupancy History

```sql
SELECT * FROM property_occupancy_history
WHERE property_id = 'property-id-uuid'
ORDER BY created_at DESC;
```

### Manually Expiring an Occupancy

```sql
UPDATE properties
SET 
  is_occupied = FALSE,
  occupied_by = NULL,
  occupancy_start_date = NULL,
  occupancy_end_date = NULL
WHERE id = 'property-id-uuid';

UPDATE property_occupancy_history
SET status = 'cancelled'
WHERE property_id = 'property-id-uuid' AND status = 'active';
```

---

## API Endpoints

### Check Property Availability

```typescript
// Property listings automatically exclude occupied properties
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('is_active', true)
  .or('is_occupied.is.null,is_occupied.eq.false')
```

### Initiate Payment (with occupancy tracking)

```typescript
POST /api/payments/initiate
{
  "amount": 2000000,
  "propertyId": "uuid",
  "monthsPaid": 2,
  "propertyCode": "1234567890",
  "phoneNumber": "256771234567",
  "provider": "mtn"
}
```

### Verify Payment (auto-marks property as occupied)

```typescript
POST /api/payments/verify
{
  "transactionId": "txn-id",
  "provider": "mtn"
}
// If status = 'completed', property is automatically marked as occupied
```

### Expire Occupancies (Cron Job)

```typescript
GET /api/cron/expire-occupancies
Headers: {
  Authorization: "Bearer your-secret-key"
}
// Returns: { success: true, expiredCount: 5 }
```

---

## Property Queries

### Get Available Properties Only

```sql
SELECT * FROM properties
WHERE is_active = TRUE
AND (is_occupied IS NULL OR is_occupied = FALSE);
```

### Get Occupied Properties

```sql
SELECT 
  p.*,
  pr.full_name as tenant_name,
  p.occupancy_end_date,
  p.paid_months
FROM properties p
JOIN profiles pr ON pr.id = p.occupied_by
WHERE p.is_occupied = TRUE
ORDER BY p.occupancy_end_date ASC;
```

### Get Properties Expiring Soon (within 7 days)

```sql
SELECT * FROM properties
WHERE is_occupied = TRUE
AND occupancy_end_date <= NOW() + INTERVAL '7 days'
ORDER BY occupancy_end_date ASC;
```

---

## Testing

### Manual Testing

1. **Test Payment Flow**:
   - Create a test property
   - Click "Make Payment"
   - Complete payment
   - Verify property disappears from listings
   - Check database: `is_occupied = true`

2. **Test Auto-Expiry**:
   - Manually set `occupancy_end_date` to past date:
     ```sql
     UPDATE properties 
     SET occupancy_end_date = NOW() - INTERVAL '1 day'
     WHERE id = 'test-property-id';
     ```
   - Call cron endpoint manually:
     ```bash
     curl -H "Authorization: Bearer your-secret" \
       https://your-domain.com/api/cron/expire-occupancies
     ```
   - Verify property is available again

3. **Test Extension**:
   ```sql
   SELECT extend_property_occupancy(
     'property-id',
     1,  -- extend by 1 month
     'admin-id',
     'Testing extension'
   );
   ```
   - Verify `occupancy_end_date` is extended

---

## Monitoring

### Check Cron Job Status

View cron job logs in:
- **Vercel**: Dashboard → Project → Functions → Cron Jobs
- **External**: Your cron service dashboard

### Monitor Occupancies

```sql
-- Count currently occupied properties
SELECT COUNT(*) FROM properties WHERE is_occupied = TRUE;

-- List expiring this month
SELECT title, occupancy_end_date 
FROM properties 
WHERE is_occupied = TRUE 
AND DATE_TRUNC('month', occupancy_end_date) = DATE_TRUNC('month', NOW());

-- View recent expirations
SELECT * FROM property_occupancy_history 
WHERE status = 'expired' 
AND updated_at >= NOW() - INTERVAL '7 days';
```

---

## Troubleshooting

### Property Not Disappearing After Payment

1. Check payment status:
   ```sql
   SELECT * FROM payment_transactions 
   WHERE property_id = 'property-id' 
   ORDER BY created_at DESC LIMIT 1;
   ```

2. Check property status:
   ```sql
   SELECT is_occupied, occupancy_end_date FROM properties WHERE id = 'property-id';
   ```

3. Check function logs in `/api/payments/verify`

### Property Not Reappearing After Expiry

1. Check current date vs expiry:
   ```sql
   SELECT occupancy_end_date, NOW() FROM properties WHERE id = 'property-id';
   ```

2. Manually run expiry function:
   ```sql
   SELECT expire_completed_occupancies();
   ```

3. Check cron job is running (view logs)

### Cron Job Not Running

1. Verify `CRON_SECRET` environment variable is set
2. Check Vercel cron job logs
3. If using external cron: verify URL and authorization header
4. Test endpoint manually with curl

---

## Future Enhancements

- [ ] Email notifications before expiry (7 days, 1 day)
- [ ] SMS reminders to tenants
- [ ] Auto-renewal option for tenants
- [ ] Admin dashboard for managing occupancies
- [ ] Payment reminders for upcoming periods
- [ ] Grace period before making property available
- [ ] Partial payment support

---

## Support

For issues or questions:
1. Check database logs in Supabase
2. Review API endpoint logs
3. Verify cron job is running
4. Check payment transaction status

---

**System Status**: ✅ Fully Implemented and Ready
**Last Updated**: 2026-01-31
