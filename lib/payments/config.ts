// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================

export const PAYMENT_CONFIG = {
  // Airtel Money Configuration
  airtel: {
    baseUrl: process.env.AIRTEL_BASE_URL || 'https://openapiuat.airtel.africa', // Use UAT for testing
    clientId: process.env.AIRTEL_CLIENT_ID || '',
    clientSecret: process.env.AIRTEL_CLIENT_SECRET || '',
    merchantId: process.env.AIRTEL_MERCHANT_ID || '',
    merchantPin: process.env.AIRTEL_MERCHANT_PIN || '',
    country: 'UG', // Uganda
    currency: 'UGX',
    environment: process.env.AIRTEL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  },
  
  // MTN Mobile Money Configuration
  mtn: {
    baseUrl: process.env.MTN_BASE_URL || 'https://sandbox.momodeveloper.mtn.com', // Sandbox for testing
    collectionPrimaryKey: process.env.MTN_COLLECTION_PRIMARY_KEY || '',
    collectionUserId: process.env.MTN_COLLECTION_USER_ID || '',
    collectionApiKey: process.env.MTN_COLLECTION_API_KEY || '',
    currency: 'UGX',
    country: 'UG',
    environment: process.env.MTN_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
    callbackUrl: process.env.MTN_CALLBACK_URL || '',
  },
  
  // General payment settings
  general: {
    defaultCurrency: 'UGX',
    timeout: 300000, // 5 minutes in milliseconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },
}

// Validate configuration
export function validatePaymentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check Airtel credentials
  if (!PAYMENT_CONFIG.airtel.clientId) {
    errors.push('Airtel Client ID is not configured')
  }
  if (!PAYMENT_CONFIG.airtel.clientSecret) {
    errors.push('Airtel Client Secret is not configured')
  }
  
  // Check MTN credentials
  if (!PAYMENT_CONFIG.mtn.collectionPrimaryKey) {
    errors.push('MTN Collection Primary Key is not configured')
  }
  if (!PAYMENT_CONFIG.mtn.collectionUserId) {
    errors.push('MTN Collection User ID is not configured')
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
