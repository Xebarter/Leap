# 🧪 Testing Payment Integration

## Test Checklist

### Pre-Testing Setup
- [ ] Database migration completed (`ADD_PAYMENT_TRANSACTIONS_UPDATES.sql`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)

---

## Test Case 1: Property Reservation with Mobile Money

### Steps:
1. **Navigate to a property**
   - Go to `/properties`
   - Click on any property
   
2. **Initiate Reservation**
   - Click "Reserve Property" button
   - If not logged in, create account or login
   - Fill in contact information:
     - Phone: +256 771 234 567
     - Email: test@example.com
     - Move-in date: [future date]
   - Select "Mobile Money (MTN/Airtel)" as payment method
   - Check "I agree to terms"
   - Click "Reserve Property"

3. **Verify Reservation Created**
   - ✅ Success message appears
   - ✅ Reservation number displayed
   - ✅ Property code (10-digit) shown
   - ✅ "Pay with Mobile Money" button visible

4. **Initiate Payment**
   - Click "Pay with Mobile Money"
   - Payment dialog opens
   - ✅ Property code displayed prominently
   - ✅ Amount shown correctly

5. **Select Provider**
   - Click "Airtel" or "MTN"
   - ✅ Provider card highlights
   - ✅ Phone number field appears

6. **Enter Phone Number**
   - For MTN Sandbox: `46733123450`
   - For Airtel Sandbox: Use provider test number
   - Click "Pay Now"

7. **Payment Processing**
   - ✅ "Payment initiated" toast appears
   - ✅ Instructions displayed
   - ✅ Transaction ID shown
   - ✅ Status shows "Processing"

8. **Payment Verification**
   - Wait for automatic verification (5 seconds)
   - Or click "Check Payment Status"
   - ✅ Status updates to "Completed" or "Failed"

9. **Verify Database Records**
   ```sql
   -- Check payment transaction
   SELECT * FROM payment_transactions 
   WHERE property_code = '[10-digit-code]'
   ORDER BY created_at DESC LIMIT 1;
   
   -- Check reservation status
   SELECT * FROM property_reservations 
   WHERE id = '[reservation-id]';
   ```

### Expected Results:
- ✅ Payment transaction created in database
- ✅ Status = 'completed' (on success)
- ✅ Reservation payment_status = 'paid'
- ✅ Reservation status = 'confirmed'
- ✅ Property code matches in all records

---

## Test Case 2: Failed Payment Scenario

### Steps:
1. Follow steps 1-6 from Test Case 1
2. Use invalid phone number: `12345`
3. Click "Pay Now"

### Expected Results:
- ✅ Error message: "Invalid phone number"
- ✅ No transaction created
- ✅ User can retry with correct number

---

## Test Case 3: Payment Timeout

### Steps:
1. Follow steps 1-6 from Test Case 1
2. After payment initiated, don't approve on phone
3. Wait for 5 minutes

### Expected Results:
- ✅ Verification stops after timeout
- ✅ "Payment Verification Timeout" message
- ✅ Manual verification button available
- ✅ Transaction status = 'pending'

---

## Test Case 4: API Endpoint Testing

### Test Payment Initiation:
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-token]" \
  -d '{
    "amount": 500000,
    "phoneNumber": "256771234567",
    "propertyCode": "1234567890",
    "provider": "airtel",
    "description": "Test payment",
    "reservationId": "test-uuid"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "transactionId": "TXN-1234567890-...",
  "providerTransactionId": "...",
  "status": "pending",
  "message": "Payment initiated successfully"
}
```

### Test Payment Verification:
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [your-token]" \
  -d '{
    "transactionId": "TXN-1234567890-...",
    "provider": "airtel"
  }'
```

### Expected Response:
```json
{
  "success": true,
  "transactionId": "TXN-1234567890-...",
  "status": "completed",
  "amount": 500000,
  "currency": "UGX"
}
```

---

## Test Case 5: Webhook Testing

### Setup:
1. Use ngrok or similar to expose local server
   ```bash
   ngrok http 3000
   ```

2. Configure webhook URL in provider dashboard:
   - Airtel: `https://your-url.ngrok.io/api/payments/webhook/airtel`
   - MTN: `https://your-url.ngrok.io/api/payments/webhook/mtn`

3. Make a payment and verify webhook receives callback

### Expected Results:
- ✅ Webhook endpoint receives POST request
- ✅ Payment status updated in database
- ✅ Reservation automatically confirmed

---

## Test Case 6: Multiple Providers

### Test with Airtel:
1. Create reservation
2. Select Airtel as provider
3. Complete payment
4. ✅ Verify transaction has `provider = 'airtel'`

### Test with MTN:
1. Create new reservation
2. Select MTN as provider
3. Complete payment
4. ✅ Verify transaction has `provider = 'mtn'`

---

## Test Case 7: Property Code Validation

### Test Invalid Code:
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "propertyCode": "123",
    "amount": 500000,
    "phoneNumber": "256771234567",
    "provider": "airtel"
  }'
```

### Expected:
- ✅ Error: "Invalid property code. Must be a 10-digit number."

---

## Test Case 8: Authentication Check

### Test Without Authentication:
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500000,
    "phoneNumber": "256771234567",
    "propertyCode": "1234567890",
    "provider": "airtel"
  }'
```

### Expected:
- ✅ Status: 401 Unauthorized
- ✅ Error: "Unauthorized"

---

## Database Verification Queries

### Check Recent Payments:
```sql
SELECT 
  pt.transaction_id,
  pt.property_code,
  pt.amount_paid_ugx / 100 as amount_ugx,
  pt.status,
  pt.provider,
  pt.payment_method,
  pt.phone_number,
  pt.created_at,
  pr.reservation_number,
  pr.payment_status as reservation_payment_status
FROM payment_transactions pt
LEFT JOIN property_reservations pr ON pr.id = pt.reservation_id
ORDER BY pt.created_at DESC
LIMIT 10;
```

### Check Payment Success Rate:
```sql
SELECT 
  provider,
  status,
  COUNT(*) as count,
  SUM(amount_paid_ugx) / 100 as total_amount
FROM payment_transactions
GROUP BY provider, status
ORDER BY provider, status;
```

### Find Failed Payments:
```sql
SELECT 
  transaction_id,
  property_code,
  phone_number,
  status,
  notes,
  created_at
FROM payment_transactions
WHERE status IN ('failed', 'cancelled')
ORDER BY created_at DESC;
```

---

## Performance Testing

### Load Test (Optional):
- Use tools like Apache JMeter or k6
- Test concurrent payment requests
- Monitor API response times
- Check database performance

### Expected Performance:
- Payment initiation: < 2 seconds
- Payment verification: < 1 second
- Webhook processing: < 500ms

---

## Production Checklist

Before going live:
- [ ] All test cases passed
- [ ] Production credentials configured
- [ ] Webhook URLs updated to production domain
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring set up
- [ ] Payment logging enabled
- [ ] Test with small real transaction
- [ ] Customer support briefed
- [ ] Refund process documented

---

## Common Test Issues

### Issue: "Cannot read property 'id' of null"
**Solution:** Ensure user is authenticated before testing

### Issue: "Property code not found"
**Solution:** Run database migration script

### Issue: "Payment provider error"
**Solution:** Check API credentials in .env.local

### Issue: "Webhook not called"
**Solution:** Verify webhook URL is publicly accessible

---

## Test Data

### Test Phone Numbers (Sandbox):
- **MTN:** 46733123450-59
- **Airtel:** Check developer portal for test numbers

### Test Property Codes:
Create test properties with valid 10-digit codes:
```sql
UPDATE properties 
SET property_code = '1234567890' 
WHERE id = '[property-id]';
```

### Test Amounts:
- Minimum: 1000 UGX (10 UGX in cents)
- Test: 500000 UGX (5000 UGX in cents)
- Maximum: Check provider limits

---

## Automated Testing Script

```bash
#!/bin/bash
# test-payments.sh

echo "Starting payment integration tests..."

# Test 1: Health check
echo "Test 1: API Health"
curl -s http://localhost:3000/api/payments/verify

# Test 2: Invalid property code
echo "Test 2: Invalid property code"
# Add test command

# Test 3: Missing authentication
echo "Test 3: Missing authentication"
# Add test command

echo "Tests completed!"
```

---

**Happy Testing! 🧪**
