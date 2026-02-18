# Fix Pesapal Authentication Error

## The Error
```json
{
  "success": false,
  "error": "Failed to initiate payment with Pesapal",
  "details": "Failed to authenticate with Pesapal: Pesapal auth error: No token received"
}
```

## Root Cause
Your `.env` file is missing the `PESAPAL_ENVIRONMENT` variable, so the code defaults to **'sandbox'** mode, but your credentials are for **production** (live) environment.

**What's happening:**
- Your credentials: Production (live) credentials
- API endpoint being used: Sandbox (`https://cybqa.pesapal.com/pesapalv3`)
- Result: Authentication fails (wrong credentials for sandbox)

## Quick Fix

### Option 1: You're using PRODUCTION credentials (recommended)

Add this line to your `.env` file:

```bash
PESAPAL_ENVIRONMENT=live
```

Your complete Pesapal config should look like:

```bash
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=nu6JUrYluZWKIK7kDq/bmAXsE+JZsOXx
PESAPAL_CONSUMER_SECRET=FJS6YRvsINWIn7oDoDLaLcfNehU=
PESAPAL_ENVIRONMENT=live
PESAPAL_CALLBACK_URL=https://localhost:3000/payment-complete
PESAPAL_IPN_ID=e4419a77-5f4c-4768-9f07-dab7b374c44d
```

**Note:** You can remove `PESAPAL_BASE_URL` - it's not used by the code.

### Option 2: You're using SANDBOX credentials for testing

If your credentials are actually for sandbox/testing:

```bash
PESAPAL_ENVIRONMENT=sandbox
```

And get sandbox credentials from Pesapal dashboard.

## After Fixing

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test the reservation flow again**
   - Go to a property
   - Click "Reserve Property"
   - Fill in the form
   - Submit
   - You should be redirected to Pesapal payment page ✅

## How to Know Which Environment You're Using

### Production (Live) Credentials:
- Used for real payments
- URL: `https://pay.pesapal.com/v3`
- Get from: Pesapal Production Dashboard

### Sandbox (Test) Credentials:
- Used for testing only
- URL: `https://cybqa.pesapal.com/pesapalv3`
- Get from: Pesapal Demo/Sandbox Dashboard
- No real money is charged

## Verification

After setting `PESAPAL_ENVIRONMENT`, check your server logs when you try to reserve:

**Should see:**
```
IPN registered successfully: [some-id]
Payment initiated successfully: { merchantReference: '...', orderTrackingId: '...' }
```

**Should NOT see:**
```
Pesapal auth failed: 401
Pesapal auth error: No token received
```

## Additional Configuration Issues to Check

### 1. Callback URL
Your callback URL is set to `https://localhost:3000/payment-complete` but should be:
```bash
PESAPAL_CALLBACK_URL=http://localhost:3000/api/payments/pesapal/callback
```

### 2. IPN URL (Optional)
You can also set:
```bash
PESAPAL_IPN_URL=http://localhost:3000/api/payments/pesapal/ipn
```

### Complete Recommended .env Config

```bash
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=nu6JUrYluZWKIK7kDq/bmAXsE+JZsOXx
PESAPAL_CONSUMER_SECRET=FJS6YRvsINWIn7oDoDLaLcfNehU=
PESAPAL_ENVIRONMENT=live
PESAPAL_CALLBACK_URL=http://localhost:3000/api/payments/pesapal/callback
PESAPAL_IPN_URL=http://localhost:3000/api/payments/pesapal/ipn
PESAPAL_IPN_ID=e4419a77-5f4c-4768-9f07-dab7b374c44d
```

**Note:** For production deployment, update the URLs to your actual domain:
```bash
PESAPAL_CALLBACK_URL=https://yourdomain.com/api/payments/pesapal/callback
PESAPAL_IPN_URL=https://yourdomain.com/api/payments/pesapal/ipn
```

## Still Not Working?

### Test your credentials directly:

Create a test file `test_pesapal_auth.js`:

```javascript
const fetch = require('node-fetch');

const PESAPAL_CONFIG = {
  consumerKey: 'nu6JUrYluZWKIK7kDq/bmAXsE+JZsOXx',
  consumerSecret: 'FJS6YRvsINWIn7oDoDLaLcfNehU=',
  baseUrl: 'https://pay.pesapal.com/v3', // or 'https://cybqa.pesapal.com/pesapalv3' for sandbox
};

async function testAuth() {
  try {
    const response = await fetch(`${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONFIG.consumerKey,
        consumer_secret: PESAPAL_CONFIG.consumerSecret,
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (data.token) {
      console.log('✅ Authentication successful!');
      console.log('Token:', data.token);
    } else {
      console.log('❌ No token received');
      console.log('Error:', data.error || data.message);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAuth();
```

Run it:
```bash
node test_pesapal_auth.js
```

This will tell you if your credentials are valid.
