// ============================================================================
// AIRTEL MONEY API INTEGRATION
// ============================================================================
// Documentation: https://developers.airtel.africa/documentation

import { PAYMENT_CONFIG, formatPhoneNumber, generateTransactionReference } from './config'
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  AirtelAuthResponse,
  AirtelPaymentRequest,
  AirtelPaymentResponse,
} from './types'

export class AirtelMoneyService {
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  /**
   * Authenticate with Airtel API and get access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const { clientId, clientSecret, baseUrl } = PAYMENT_CONFIG.airtel

    try {
      const response = await fetch(`${baseUrl}/auth/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`)
      }

      const data: AirtelAuthResponse = await response.json()
      this.accessToken = data.access_token
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

      return this.accessToken
    } catch (error) {
      console.error('Airtel authentication error:', error)
      throw new Error('Failed to authenticate with Airtel Money API')
    }
  }

  /**
   * Initiate a payment request via Airtel Money
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.authenticate()
      const { baseUrl, country, currency, merchantId } = PAYMENT_CONFIG.airtel

      // Format phone number (remove country code for Airtel)
      const msisdn = formatPhoneNumber(request.phoneNumber, 'airtel')
      const transactionId = generateTransactionReference(request.propertyCode)

      const payload: AirtelPaymentRequest = {
        reference: transactionId,
        subscriber: {
          country,
          currency,
          msisdn,
        },
        transaction: {
          amount: request.amount,
          country,
          currency,
          id: transactionId,
        },
      }

      const response = await fetch(
        `${baseUrl}/merchant/v1/payments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Country': country,
            'X-Currency': currency,
          },
          body: JSON.stringify(payload),
        }
      )

      const result: AirtelPaymentResponse = await response.json()

      if (result.status.success) {
        return {
          success: true,
          transactionId,
          providerTransactionId: result.data.transaction.id,
          status: 'pending',
          message: 'Payment initiated successfully. Please check your phone to complete the payment.',
        }
      } else {
        return {
          success: false,
          transactionId,
          status: 'failed',
          message: result.status.message || 'Payment initiation failed',
        }
      }
    } catch (error) {
      console.error('Airtel payment initiation error:', error)
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment initiation failed',
      }
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const token = await this.authenticate()
      const { baseUrl, country, currency } = PAYMENT_CONFIG.airtel

      const response = await fetch(
        `${baseUrl}/standard/v1/payments/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': country,
            'X-Currency': currency,
          },
        }
      )

      const result = await response.json()

      // Map Airtel status to our internal status
      let status: PaymentVerification['status'] = 'pending'
      if (result.status.success && result.data.transaction.status === 'TS') {
        status = 'completed'
      } else if (result.data.transaction.status === 'TF') {
        status = 'failed'
      }

      return {
        transactionId,
        status,
        amount: result.data.transaction.amount || 0,
        currency: result.data.transaction.currency || currency,
        providerTransactionId: result.data.transaction.id,
        providerReference: result.data.transaction.airtel_money_id,
        completedAt: status === 'completed' ? new Date() : undefined,
        failureReason: status === 'failed' ? result.status.message : undefined,
      }
    } catch (error) {
      console.error('Airtel payment verification error:', error)
      throw new Error('Failed to verify payment status')
    }
  }

  /**
   * Check account balance (for admin/monitoring purposes)
   */
  async checkBalance(): Promise<{ balance: number; currency: string }> {
    try {
      const token = await this.authenticate()
      const { baseUrl, country, currency } = PAYMENT_CONFIG.airtel

      const response = await fetch(
        `${baseUrl}/standard/v1/users/balance`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': country,
            'X-Currency': currency,
          },
        }
      )

      const result = await response.json()

      return {
        balance: result.data.balance || 0,
        currency: result.data.currency || currency,
      }
    } catch (error) {
      console.error('Airtel balance check error:', error)
      throw new Error('Failed to check account balance')
    }
  }
}

// Export singleton instance
export const airtelMoney = new AirtelMoneyService()
