// ============================================================================
// PESAPAL PAYMENT SERVICE
// ============================================================================

import { PAYMENT_CONFIG } from './config'

const PESAPAL_CONFIG = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY || '',
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET || '',
  environment: process.env.PESAPAL_ENVIRONMENT || 'sandbox', // 'sandbox' or 'live'
  baseUrl:
    process.env.PESAPAL_ENVIRONMENT === 'live'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3',
  callbackUrl: process.env.PESAPAL_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/pesapal/callback`,
  ipnUrl: process.env.PESAPAL_IPN_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/pesapal/ipn`,
}

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error?: any
  message?: string
}

interface PesapalSubmitOrderRequest {
  id: string // Merchant reference (unique transaction ID)
  currency: string
  amount: number
  description: string
  callback_url: string
  notification_id: string
  billing_address: {
    email_address: string
    phone_number: string
    country_code: string
    first_name: string
    middle_name?: string
    last_name: string
    line_1?: string
    line_2?: string
    city?: string
    state?: string
    postal_code?: string
    zip_code?: string
  }
}

interface PesapalSubmitOrderResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  error?: any
  message?: string
  status?: string
}

interface PesapalTransactionStatus {
  payment_method: string
  amount: number
  created_date: string
  confirmation_code: string
  payment_status_description: string
  description: string
  message: string
  payment_account: string
  call_back_url: string
  status_code: number
  merchant_reference: string
  payment_status_code: string
  currency: string
  error?: any
}

// Token cache
let cachedToken: { token: string; expiryDate: Date } | null = null

/**
 * Get authentication token from Pesapal
 */
async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && new Date() < cachedToken.expiryDate) {
    return cachedToken.token
  }

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
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pesapal auth failed: ${response.status} - ${errorText}`)
    }

    const data: PesapalAuthResponse = await response.json()

    if (data.error || !data.token) {
      throw new Error(`Pesapal auth error: ${data.message || 'No token received'}`)
    }

    // Cache the token (expires in ~1 hour typically)
    cachedToken = {
      token: data.token,
      expiryDate: new Date(data.expiryDate),
    }

    return data.token
  } catch (error) {
    console.error('Pesapal authentication error:', error)
    throw new Error(`Failed to authenticate with Pesapal: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Register IPN URL with Pesapal
 */
export async function registerIPN(): Promise<string> {
  try {
    const token = await getAuthToken()

    const response = await fetch(`${PESAPAL_CONFIG.baseUrl}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.ipnUrl,
        ipn_notification_type: 'GET',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`IPN registration failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`IPN registration error: ${data.message || 'Unknown error'}`)
    }

    return data.ipn_id
  } catch (error) {
    console.error('Pesapal IPN registration error:', error)
    throw error
  }
}

/**
 * Submit an order to Pesapal and get payment URL
 */
export async function submitOrder(params: {
  merchantReference: string
  amount: number
  currency: string
  description: string
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  notificationId: string
}): Promise<{ orderTrackingId: string; redirectUrl: string; merchantReference: string }> {
  try {
    const token = await getAuthToken()

    const orderRequest: PesapalSubmitOrderRequest = {
      id: params.merchantReference,
      currency: params.currency,
      amount: params.amount,
      description: params.description,
      callback_url: PESAPAL_CONFIG.callbackUrl,
      notification_id: params.notificationId,
      billing_address: {
        email_address: params.email,
        phone_number: params.phoneNumber,
        country_code: 'UG',
        first_name: params.firstName,
        last_name: params.lastName,
      },
    }

    console.log('Submitting order to Pesapal:', {
      merchantReference: params.merchantReference,
      amount: params.amount,
      currency: params.currency,
    })

    const response = await fetch(`${PESAPAL_CONFIG.baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pesapal order submission failed: ${response.status} - ${errorText}`)
    }

    const data: PesapalSubmitOrderResponse = await response.json()

    if (data.error || data.status === '500') {
      throw new Error(`Pesapal order error: ${data.message || 'Unknown error'}`)
    }

    if (!data.redirect_url || !data.order_tracking_id) {
      throw new Error('Invalid response from Pesapal: missing redirect URL or tracking ID')
    }

    console.log('Pesapal order submitted successfully:', {
      orderTrackingId: data.order_tracking_id,
      merchantReference: data.merchant_reference,
    })

    return {
      orderTrackingId: data.order_tracking_id,
      redirectUrl: data.redirect_url,
      merchantReference: data.merchant_reference,
    }
  } catch (error) {
    console.error('Pesapal order submission error:', error)
    throw error
  }
}

/**
 * Get transaction status from Pesapal
 */
export async function getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  try {
    const token = await getAuthToken()

    const response = await fetch(
      `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Transaction status check failed: ${response.status} - ${errorText}`)
    }

    const data: PesapalTransactionStatus = await response.json()

    if (data.error) {
      throw new Error(`Transaction status error: ${data.message || 'Unknown error'}`)
    }

    return data
  } catch (error) {
    console.error('Pesapal transaction status error:', error)
    throw error
  }
}

/**
 * Validate Pesapal configuration
 */
export function validatePesapalConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!PESAPAL_CONFIG.consumerKey) {
    errors.push('Pesapal Consumer Key is not configured (PESAPAL_CONSUMER_KEY)')
  }
  if (!PESAPAL_CONFIG.consumerSecret) {
    errors.push('Pesapal Consumer Secret is not configured (PESAPAL_CONSUMER_SECRET)')
  }
  if (!PESAPAL_CONFIG.callbackUrl) {
    errors.push('Pesapal Callback URL is not configured')
  }
  if (!PESAPAL_CONFIG.ipnUrl) {
    errors.push('Pesapal IPN URL is not configured')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export { PESAPAL_CONFIG }
