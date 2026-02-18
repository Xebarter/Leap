// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================

function env(name: string, fallback = '') {
  // Some .env files include inline comments like: KEY=value  # comment
  // Strip anything after the first whitespace.
  const raw = process.env[name]
  if (!raw) return fallback
  return raw.trim().split(/\s+/)[0]
}

function appUrl() {
  return env('NEXT_PUBLIC_APP_URL', env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'))
}

function airtelBaseUrl(environment: string) {
  // Airtel sandbox = UAT
  if (environment === 'sandbox') return env('AIRTEL_BASE_URL', 'https://openapiuat.airtel.africa')
  return env('AIRTEL_BASE_URL', 'https://openapi.airtel.africa')
}

function mtnBaseUrl(environment: string) {
  if (environment === 'sandbox') return env('MTN_BASE_URL', 'https://sandbox.momodeveloper.mtn.com')
  return env('MTN_BASE_URL', 'https://proxy.momoapi.mtn.com')
}

export const PAYMENT_CONFIG = {
  // Airtel Money Configuration
  airtel: {
    environment: env('AIRTEL_ENVIRONMENT', 'sandbox'), // 'sandbox' or 'production'
    baseUrl: '', // set below
    clientId: env('AIRTEL_CLIENT_ID'),
    clientSecret: env('AIRTEL_CLIENT_SECRET'),
    merchantId: env('AIRTEL_MERCHANT_ID'),
    merchantPin: env('AIRTEL_MERCHANT_PIN'),
    country: env('AIRTEL_COUNTRY', 'UG'),
    currency: env('AIRTEL_CURRENCY', 'UGX'),
    // Optional: if you register a callback URL with Airtel
    callbackUrl: env('AIRTEL_CALLBACK_URL', `${appUrl()}/api/payments/webhook/airtel`),
  },

  // MTN Mobile Money Configuration
  mtn: {
    environment: env('MTN_ENVIRONMENT', 'sandbox'), // 'sandbox' or 'production'
    baseUrl: '', // set below
    collectionPrimaryKey: env('MTN_COLLECTION_PRIMARY_KEY'),
    collectionUserId: env('MTN_COLLECTION_USER_ID'),
    collectionApiKey: env('MTN_COLLECTION_API_KEY'),
    country: env('MTN_COUNTRY', 'UG'),
    // Sandbox commonly uses EUR; allow override.
    currency: env('MTN_CURRENCY', env('CURRENCY', 'EUR')),
    callbackUrl: env('MTN_CALLBACK_URL', `${appUrl()}/api/payments/webhook/mtn`),
  },

  // Pesapal Configuration
  pesapal: {
    consumerKey: env('PESAPAL_CONSUMER_KEY'),
    consumerSecret: env('PESAPAL_CONSUMER_SECRET'),
    environment: env('PESAPAL_ENVIRONMENT', 'sandbox'), // 'sandbox' or 'live'
    callbackUrl: env('PESAPAL_CALLBACK_URL', `${appUrl()}/api/payments/pesapal/callback`),
    ipnUrl: env('PESAPAL_IPN_URL', `${appUrl()}/api/payments/pesapal/ipn`),
  },

  // General payment settings
  general: {
    defaultCurrency: env('PAYMENT_DEFAULT_CURRENCY', 'UGX'),
    timeout: 300000, // 5 minutes in milliseconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },
}

// compute base urls after env is read
PAYMENT_CONFIG.airtel.baseUrl = airtelBaseUrl(PAYMENT_CONFIG.airtel.environment)
PAYMENT_CONFIG.mtn.baseUrl = mtnBaseUrl(PAYMENT_CONFIG.mtn.environment)


// Validate configuration
export function validatePaymentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check Airtel credentials
  if (!PAYMENT_CONFIG.airtel.clientId) errors.push('Airtel Client ID is not configured')
  if (!PAYMENT_CONFIG.airtel.clientSecret) errors.push('Airtel Client Secret is not configured')
  if (!PAYMENT_CONFIG.airtel.merchantId) errors.push('Airtel Merchant ID is not configured')
  if (!PAYMENT_CONFIG.airtel.merchantPin) errors.push('Airtel Merchant PIN is not configured')

  // Check MTN credentials
  if (!PAYMENT_CONFIG.mtn.collectionPrimaryKey) errors.push('MTN Collection Primary Key is not configured')
  if (!PAYMENT_CONFIG.mtn.collectionUserId) errors.push('MTN Collection User ID is not configured')
  if (!PAYMENT_CONFIG.mtn.collectionApiKey) errors.push('MTN Collection API Key is not configured')

  // Sandbox sanity checks
  if (PAYMENT_CONFIG.mtn.environment === 'sandbox' && !PAYMENT_CONFIG.mtn.callbackUrl) {
    errors.push('MTN callback URL is not configured (MTN_CALLBACK_URL or NEXT_PUBLIC_APP_URL)')
  }
  if (PAYMENT_CONFIG.airtel.environment === 'sandbox' && !PAYMENT_CONFIG.airtel.baseUrl.includes('uat')) {
    errors.push('Airtel sandbox should use UAT base URL (https://openapiuat.airtel.africa)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// Helper to format phone number for each provider
export function formatPhoneNumber(phone: string, provider: 'airtel' | 'mtn'): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If it starts with 256, remove it (we'll add it back as needed)
  if (cleaned.startsWith('256')) {
    cleaned = cleaned.substring(3)
  }
  
  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // For Airtel: return without country code
  // For MTN: return with country code
  if (provider === 'airtel') {
    return cleaned // e.g., "771234567"
  } else {
    return '256' + cleaned // e.g., "256771234567"
  }
}

// Generate unique transaction reference
export function generateTransactionReference(propertyCode: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `TXN-${propertyCode}-${timestamp}-${random}`
}
