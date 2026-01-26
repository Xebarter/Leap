# 🚀 Quick Start: Mobile Money Payments

## Get Started in 5 Minutes

### Step 1: Configure Environment Variables

Copy `.env.example` to `.env.local` and add your credentials:

```bash
cp .env.example .env.local
```

**For Testing (Sandbox):**
```env
# Airtel Money Sandbox
AIRTEL_BASE_URL=https://openapiuat.airtel.africa
AIRTEL_CLIENT_ID=your_sandbox_client_id
AIRTEL_CLIENT_SECRET=your_sandbox_client_secret
AIRTEL_ENVIRONMENT=sandbox

# MTN Mobile Money Sandbox
MTN_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_COLLECTION_PRIMARY_KEY=your_sandbox_key
MTN_ENVIRONMENT=sandbox
```

### Step 2: Update Database

Run the SQL script in your Supabase dashboard:

```sql
-- Copy and paste from scripts/ADD_PAYMENT_TRANSACTIONS_UPDATES.sql
```

### Step 3: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to any property details page**

3. **Click "Reserve Property"**

4. **Fill in the form and select "Mobile Money"**

5. **Click "Pay with Mobile Money" after reservation is created**

6. **Choose Airtel or MTN and enter test phone number**

### Test Phone Numbers

**MTN Sandbox:** `46733123450` - `46733123459`
**Airtel Sandbox:** Use numbers provided in your Airtel developer account

---

## 📱 Using the Payment Dialog

The payment dialog is already integrated into:
- ✅ Property reservation flow
- ✅ Booking payments
- ✅ Any other payment needs

**To use in other components:**

```tsx
import { MobileMoneyPaymentDialog } from '@/components/publicView/mobile-money-payment-dialog'

function YourComponent() {
  const [showPayment, setShowPayment] = useState(false)
  
  return (
    <>
      <Button onClick={() => setShowPayment(true)}>
        Pay Now
      </Button>
      
      <MobileMoneyPaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={500000}  // Amount in UGX
        propertyCode="1234567890"  // 10-digit code
        propertyTitle="Property Name"
        reservationId="uuid-here"  // Optional
        bookingId="uuid-here"  // Optional
        onSuccess={(transactionId) => {
          console.log('Payment successful:', transactionId)
          // Handle success
        }}
      />
    </>
  )
}
```

---

## ✅ What's Already Working

1. **Payment Initiation:** Users can pay via Airtel or MTN
2. **Real-time Verification:** Automatic status checking
3. **Webhook Support:** Automatic updates from providers
4. **Database Integration:** All transactions are recorded
5. **Reservation Updates:** Automatic confirmation on payment

---

## 🔧 Configuration Options

Edit `lib/payments/config.ts` to customize:

```typescript
export const PAYMENT_CONFIG = {
  general: {
    defaultCurrency: 'UGX',
    timeout: 300000,  // 5 minutes
    retryAttempts: 3,
    retryDelay: 5000,  // 5 seconds
  },
}
```

---

## 📊 Check Payment Status

**Via API:**
```typescript
const response = await fetch('/api/payments/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: 'TXN-1234567890-1234567890-123',
    provider: 'airtel',
  }),
})
```

**Via Database:**
```sql
SELECT * FROM payment_transactions 
WHERE transaction_id = 'TXN-1234567890-1234567890-123';
```

---

## 🚨 Common Questions

**Q: Where do I get API credentials?**
- Airtel: https://developers.airtel.africa/
- MTN: https://momodeveloper.mtn.com/

**Q: Can I test without real API credentials?**
- You need sandbox credentials from both providers
- They're free to obtain

**Q: How do webhooks work?**
- Configure webhook URLs in provider dashboards
- Webhooks automatically update payment status
- No action needed if payment succeeds

**Q: What if payment times out?**
- User can manually check status
- System polls for 5 minutes
- Transaction stays in database for review

---

## 📖 Full Documentation

See `PAYMENT_INTEGRATION_GUIDE.md` for complete documentation.

---

**Ready to go live?** Change `ENVIRONMENT` variables to `production` and update API URLs!
