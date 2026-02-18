# Pesapal Payment Integration - Complete Guide

## ✅ Implementation Complete

Pesapal payment integration has been successfully implemented for property reservations.

## 📋 What Was Implemented

### 1. **Pesapal Service Module** (`lib/payments/pesapal.ts`)
   - Authentication with Pesapal API
   - Token management and caching
   - IPN (Instant Payment Notification) registration
   - Order submission to Pesapal
   - Transaction status checking
   - Configuration validation

### 2. **API Endpoints**
   - **`/api/payments/pesapal/initiate`** - Initiate payment and get redirect URL
   - **`/api/payments/pesapal/callback`** - Handle user redirect after payment
   - **`/api/payments/pesapal/ipn`** - Handle instant payment notifications from Pesapal

### 3. **UI Integration**
   - Updated Reserve Property form to use Pesapal
   - Payment success page (`/payment-success`)
   - Payment failure page (`/payment-failed`)
   - Automatic redirect to Pesapal payment page

### 4. **Database Integration**
   - Payment transactions stored in `payment_transactions` table
   - Reservations updated automatically on payment success
   - Transaction tracking with Pesapal order IDs

## 🔧 Environment Variables Required

Add these to your `.env.local` file:

```env
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_ENVIRONMENT=sandbox  # or 'live' for production
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/payments/pesapal/callback
PESAPAL_IPN_URL=https://yourdomain.com/api/payments/pesapal/ipn

# Optional: If you've already registered an IPN, provide the ID
PESAPAL_IPN_ID=your_ipn_id_here

# Make sure you have this set
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🚀 How to Get Pesapal Credentials

### Sandbox (Testing)
1. Go to https://developer.pesapal.com/
2. Sign up for a developer account
3. Navigate to "API Keys" section
4. Copy your **Consumer Key** and **Consumer Secret**
5. Use environment: `sandbox`

### Production (Live)
1. Go to https://www.pesapal.com/
2. Sign up for a business account
3. Complete KYC verification
4. Get your production API keys
5. Use environment: `live`

## 📝 Payment Flow

### User Journey:
1. User clicks "Reserve Property"
2. User fills in contact details
3. User selects payment method (Pesapal)
4. User submits the form
5. System creates reservation in database
6. System initiates Pesapal payment
7. **User is redirected to Pesapal payment page**
8. User completes payment (card or mobile money)
9. Pesapal redirects back to `/payment-success` or `/payment-failed`
10. System updates reservation status

### Technical Flow:
```
Reserve Form Submit
    ↓
Create Reservation (pending)
    ↓
Call /api/payments/pesapal/initiate
    ↓
Create Payment Transaction (pending)
    ↓
Submit Order to Pesapal API
    ↓
Get redirect URL
    ↓
Redirect user to Pesapal
    ↓
User pays on Pesapal
    ↓
Pesapal redirects to /api/payments/pesapal/callback
    ↓
Get transaction status from Pesapal
    ↓
Update payment_transactions (completed/failed)
    ↓
Update reservation (confirmed/failed)
    ↓
Redirect to success/failure page
    ↓
[Background] Pesapal sends IPN to /api/payments/pesapal/ipn
```

## 🧪 Testing

### Test with Sandbox:
1. Set `PESAPAL_ENVIRONMENT=sandbox`
2. Use Pesapal test credentials
3. When redirected to Pesapal, use test card numbers:
   - **Visa**: `4111 1111 1111 1111`
   - **Mastercard**: `5500 0000 0000 0004`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

### Test Mobile Money:
- Pesapal sandbox supports test mobile money numbers
- Check Pesapal developer documentation for test numbers

## 💾 Database Tables Used

### `payment_transactions`
Stores all payment attempts and completions:
- `transaction_id` - Unique merchant reference
- `provider_transaction_id` - Pesapal order tracking ID
- `provider_reference` - Pesapal confirmation code
- `status` - pending, processing, completed, failed
- `amount_paid_ugx` - Amount in UGX
- `reservation_id` - Link to reservation

### `property_reservations`
Updated when payment completes:
- `status` - changes to "confirmed" on success
- `payment_status` - changes to "paid" on success

## 🔐 Security Features

- ✅ Token caching to minimize API calls
- ✅ Secure server-side API communication
- ✅ Transaction verification via Pesapal API
- ✅ IPN (webhook) for background status updates
- ✅ Automatic cleanup of failed reservations

## 📊 Payment Methods Supported

Via Pesapal, users can pay with:
- 💳 **Visa Cards**
- 💳 **Mastercard**
- 📱 **MTN Mobile Money**
- 📱 **Airtel Money**
- 🏦 **Bank Transfers** (depending on your Pesapal setup)

## 🛠️ Troubleshooting

### Issue: "Pesapal is not properly configured"
**Solution**: Check that all environment variables are set correctly

### Issue: "Payment initiation failed"
**Solution**: 
- Verify API credentials are correct
- Check Pesapal dashboard for any account issues
- Review server logs for detailed error messages

### Issue: "No redirect URL received"
**Solution**: 
- Ensure IPN is registered (check logs)
- Verify Pesapal account is active
- Check that callback URLs are accessible

### Issue: Payment successful but reservation not confirmed
**Solution**: 
- Check `/api/payments/pesapal/callback` logs
- Verify database permissions
- Check IPN notifications in Pesapal dashboard

## 📞 Support

- **Pesapal Support**: https://support.pesapal.com/
- **Pesapal Developer Docs**: https://developer.pesapal.com/
- **Pesapal API Reference**: https://developer.pesapal.com/api-reference

## 🎯 Next Steps

1. ✅ Add Pesapal credentials to `.env.local`
2. ✅ Test in sandbox mode
3. ✅ Register IPN URL with Pesapal (done automatically on first payment)
4. ✅ Test complete payment flow
5. ✅ Switch to production when ready
6. ✅ Monitor payments in Pesapal dashboard

## ✨ Features

- **Multiple Payment Methods**: Cards and Mobile Money via one integration
- **Automatic Status Updates**: IPN keeps payments in sync
- **User-Friendly**: Clean redirect flow with success/failure pages
- **Secure**: Server-side API communication only
- **Reliable**: Transaction verification and status tracking

---

**Status**: ✅ Ready to Use
**Environment**: Sandbox (switch to live when ready)
**Payment Methods**: Card, MTN, Airtel via Pesapal
