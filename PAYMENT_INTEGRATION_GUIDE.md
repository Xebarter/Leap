# Mobile Money Payment Integration Guide

## Overview

This guide covers the complete implementation of Airtel Money and MTN Mobile Money payment integration for property reservations and all other forms of payment in the application. All payments are referenced using the unique 10-digit property code.

---

## 🚀 Features Implemented

### 1. **Payment Providers**
- ✅ Airtel Money API Integration
- ✅ MTN Mobile Money API Integration
- ✅ Unified payment service layer
- ✅ Payment status tracking and verification
- ✅ Webhook handlers for payment callbacks

### 2. **Payment Flows**
- ✅ Property reservation payments
- ✅ Mobile money payment dialog with provider selection
- ✅ Real-time payment verification
- ✅ Automatic reservation confirmation on successful payment

### 3. **Database Integration**
- ✅ Payment transactions table with property code reference
- ✅ Integration with property reservations
- ✅ Payment history tracking
- ✅ Status updates via webhooks

---

## 📁 File Structure

```
lib/payments/
├── types.ts                    # TypeScript interfaces for payments
├── config.ts                   # Payment provider configuration
├── airtel.ts                   # Airtel Money API service
├── mtn.ts                      # MTN Mobile Money API service
├── payment-service.ts          # Unified payment service
└── index.ts                    # Module exports

app/api/payments/
├── initiate/route.ts          # Payment initiation endpoint
├── verify/route.ts            # Payment verification endpoint
└── webhook/
    ├── airtel/route.ts        # Airtel webhook handler
    └── mtn/route.ts           # MTN webhook handler

components/publicView/
├── mobile-money-payment-dialog.tsx  # Payment UI component
└── reserve-property-dialog.tsx      # Updated with payment integration

scripts/
└── ADD_PAYMENT_TRANSACTIONS_UPDATES.sql  # Database schema updates
```

---

## 🔧 Setup Instructions

### Step 1: Environment Variables

Copy `.env.example` to `.env.local` and configure your API credentials:

```bash
# Airtel Money Configuration
AIRTEL_BASE_URL=https://openapiuat.airtel.africa  # Use production URL for live
AIRTEL_CLIENT_ID=your_airtel_client_id
AIRTEL_CLIENT_SECRET=your_airtel_client_secret
AIRTEL_MERCHANT_ID=your_airtel_merchant_id
AIRTEL_MERCHANT_PIN=your_airtel_merchant_pin
AIRTEL_ENVIRONMENT=sandbox  # Change to 'production' for live

# MTN Mobile Money Configuration
MTN_BASE_URL=https://sandbox.momodeveloper.mtn.com  # Use production URL for live
MTN_COLLECTION_PRIMARY_KEY=your_mtn_collection_primary_key
MTN_COLLECTION_USER_ID=your_mtn_collection_user_id
MTN_COLLECTION_API_KEY=your_mtn_collection_api_key
MTN_ENVIRONMENT=sandbox  # Change to 'production' for live
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/webhook/mtn
```

### Step 2: Database Schema Updates

Run the SQL script to update your database schema:

```bash
# Execute in your Supabase SQL Editor
psql -f scripts/ADD_PAYMENT_TRANSACTIONS_UPDATES.sql
```

This adds:
- `property_code` column (10-digit reference)
- `reservation_id` column (link to property reservations)
- `phone_number` and `email` columns
- Necessary indexes for performance

### Step 3: Install Dependencies

The implementation uses existing dependencies. If you need UUID generation for MTN:

```bash
npm install uuid
# or
pnpm install uuid
```

### Step 4: API Credentials Setup

#### **Airtel Money:**
1. Register at [Airtel Developer Portal](https://developers.airtel.africa/)
2. Create an application
3. Get your Client ID and Client Secret
4. Set up your merchant account

#### **MTN Mobile Money:**
1. Register at [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
2. Subscribe to Collections API
3. Generate API User and API Key
4. Get your subscription key (Primary Key)

---

## 💳 How to Use

### For Property Reservations

1. **User reserves a property:**
   ```tsx
   <ReservePropertyDialog
     propertyId="uuid"
     propertyTitle="Property Name"
     propertyLocation="Location"
     monthlyRent={500000}  // Amount in cents (UGX)
     propertyCode="1234567890"  // 10-digit code
   />
   ```

2. **User selects Mobile Money as payment method**

3. **After reservation is created, user clicks "Pay with Mobile Money"**

4. **Mobile Money Payment Dialog opens:**
   - User selects provider (Airtel or MTN)
   - Enters their mobile money phone number
   - Clicks "Pay Now"

5. **System initiates payment:**
   - API call to `/api/payments/initiate`
   - Payment request sent to provider
   - User receives prompt on their phone

6. **User approves payment on their phone**

7. **System verifies payment:**
   - Automatic polling every 5 seconds
   - Manual verification button available
   - Webhook updates status automatically

8. **On successful payment:**
   - Reservation status updated to "confirmed"
   - Payment status updated to "paid"
   - User sees success message

### API Endpoints

#### **POST /api/payments/initiate**

Initiates a new payment transaction.

**Request Body:**
```json
{
  "amount": 500000,
  "phoneNumber": "256771234567",
  "propertyCode": "1234567890",
  "provider": "airtel",
  "email": "user@example.com",
  "description": "Payment for Property XYZ",
  "reservationId": "uuid",
  "bookingId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN-1234567890-1234567890-123",
  "providerTransactionId": "airtel-txn-id",
  "status": "pending",
  "message": "Payment initiated successfully"
}
```

#### **POST /api/payments/verify**

Verifies the status of a payment transaction.

**Request Body:**
```json
{
  "transactionId": "TXN-1234567890-1234567890-123",
  "providerTransactionId": "airtel-txn-id",
  "provider": "airtel"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN-1234567890-1234567890-123",
  "status": "completed",
  "amount": 500000,
  "currency": "UGX",
  "providerTransactionId": "airtel-txn-id",
  "providerReference": "ref-12345",
  "completedAt": "2026-01-24T14:30:00Z"
}
```

#### **POST /api/payments/webhook/airtel**

Webhook endpoint for Airtel Money callbacks.

#### **POST /api/payments/webhook/mtn**

Webhook endpoint for MTN Mobile Money callbacks.

---

## 🔐 Security Considerations

1. **API Keys:** Never commit API keys to version control
2. **Webhooks:** Validate webhook signatures (implement signature verification)
3. **Phone Numbers:** Validate and sanitize phone number inputs
4. **Amount Validation:** Always verify payment amounts on the server
5. **Property Code:** Validate that the property code exists before processing payment
6. **User Authentication:** All payment endpoints require authentication

---

## 📊 Payment Status Flow

```
pending → processing → completed
                    ↓
                  failed
```

- **pending:** Payment initiated, waiting for user action
- **processing:** User has approved, payment being processed
- **completed:** Payment successful, funds received
- **failed:** Payment failed or rejected
- **refunded:** Payment was refunded (manual process)
- **cancelled:** Payment was cancelled before completion

---

## 🧪 Testing

### Sandbox Testing

Both providers offer sandbox environments:

**Airtel Money Sandbox:**
- Test phone numbers provided by Airtel
- Use test credentials from developer portal

**MTN Mobile Money Sandbox:**
- Use test phone numbers: `46733123450` - `46733123459`
- EUR currency in sandbox, UGX in production

### Test Payment Flow

1. Create a test property with a 10-digit code
2. Create a reservation
3. Initiate payment with test phone number
4. Check logs for payment status
5. Manually verify using verification endpoint

---

## 🚨 Common Issues & Solutions

### Issue: "Authentication failed"
**Solution:** Check your API credentials in `.env.local`

### Issue: "Invalid phone number"
**Solution:** Ensure phone number is in format `256XXXXXXXXX`

### Issue: "Payment timeout"
**Solution:** Increase timeout in `lib/payments/config.ts`

### Issue: "Property code not found"
**Solution:** Ensure property has a valid 10-digit code in database

### Issue: "Webhook not receiving callbacks"
**Solution:** 
- Check webhook URL is publicly accessible
- Verify URL is configured in provider dashboard
- Check webhook endpoint logs

---

## 📝 Property Code Implementation

All payments use the **10-digit property code** as the reference:

1. **Properties Table:** Each property has a `property_code` column
2. **Auto-Generation:** Codes are auto-generated when property is created
3. **Payment Reference:** Used in transaction descriptions and records
4. **User-Facing:** Displayed to users for manual payment verification

**Example:**
```sql
-- Property code generation
CREATE OR REPLACE FUNCTION generate_property_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  new_code VARCHAR(10);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
    SELECT EXISTS(SELECT 1 FROM properties WHERE property_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 Future Enhancements

- [ ] Add support for bank transfers
- [ ] Implement card payment gateway
- [ ] Add payment receipts generation (PDF)
- [ ] Payment reminders and notifications
- [ ] Refund processing automation
- [ ] Payment analytics dashboard
- [ ] Multi-currency support
- [ ] Recurring payment subscriptions

---

## 📞 Support

For issues related to:
- **Airtel Money:** Contact Airtel Developer Support
- **MTN Mobile Money:** Contact MTN MoMo Developer Support
- **Implementation:** Check the codebase documentation

---

## 📄 License

This implementation is part of your property management system. Ensure compliance with payment provider terms of service.

---

**Last Updated:** January 24, 2026
**Version:** 1.0.0
