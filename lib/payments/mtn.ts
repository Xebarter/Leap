// ============================================================================
// MTN MOBILE MONEY API INTEGRATION
// ============================================================================
// Documentation: https://momodeveloper.mtn.com/

import { v4 as uuidv4 } from 'uuid'
import { PAYMENT_CONFIG, formatPhoneNumber, generateTransactionReference } from './config'
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  MTNPaymentRequest,
  MTNPaymentResponse,
  MTNTransactionStatus,
} from './types'

export class MTNMomoService {
  /**
   * Generate access token for API requests
   */
  private async getAccessToken(): Promise<string> {
    const { baseUrl, collectionPrimaryKey, collectionUserId, collectionApiKey } = PAYMENT_CONFIG.mtn

    try {
      const response = await fetch(
        `${baseUrl}/collection/token/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': collectionPrimaryKey,
            'Authorization': `Basic ${Buffer.from(`${collectionUserId}:${collectionApiKey}`).toString('base64')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      console.error('MTN token generation error:', error)
      throw new Error('Failed to authenticate with MTN Mobile Money API')
    }
  }

  /**
   * Initiate a payment request via MTN Mobile Money
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken()
      const { baseUrl, collectionPrimaryKey, currency, callbackUrl } = PAYMENT_CONFIG.mtn

      // Format phone number (with country code for MTN)
      const msisdn = formatPhoneNumber(request.phoneNumber, 'mtn')
      
      // Generate unique reference ID (UUID)
      const referenceId = uuidv4()
      const externalId = generateTransactionReference(request.propertyCode)

      const payload: MTNPaymentRequest = {
        amount: request.amount.toString(),
        currency,
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: msisdn,
        },
        payerMessage: request.description || `Payment for property ${request.propertyCode}`,
        payeeNote: `Property payment - Ref: ${request.propertyCode}`,
      }

      const response = await fetch(
        `${baseUrl}/collection/v1_0/requesttopay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': PAYMENT_CONFIG.mtn.environment === 'sandbox' ? 'sandbox' : 'production',
            'Ocp-Apim-Subscription-Key': collectionPrimaryKey,
            'X-Callback-Url': callbackUrl,
          },
          body: JSON.stringify(payload),
        }
      )

      // MTN returns 202 Accepted for successful initiation
      if (response.status === 202) {
        return {
          success: true,
          transactionId: externalId,
          providerTransactionId: referenceId,
          status: 'pending',
          message: 'Payment initiated successfully. Please approve the transaction on your phone.',
        }
      } else {
        const error = await response.json()
        return {
          success: false,
          transactionId: externalId,
          status: 'failed',
          message: error.message || 'Payment initiation failed',
        }
      }
    } catch (error) {
      console.error('MTN payment initiation error:', error)
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
  async verifyPayment(referenceId: string): Promise<PaymentVerification> {
    try {
      const token = await this.getAccessToken()
      const { baseUrl, collectionPrimaryKey } = PAYMENT_CONFIG.mtn

      const response = await fetch(
        `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': PAYMENT_CONFIG.mtn.environment === 'sandbox' ? 'sandbox' : 'production',
            'Ocp-Apim-Subscription-Key': collectionPrimaryKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to verify payment: ${response.statusText}`)
      }

      const result: MTNTransactionStatus = await response.json()

      // Map MTN status to our internal status
      let status: PaymentVerification['status'] = 'pending'
      if (result.status === 'SUCCESSFUL') {
        status = 'completed'
      } else if (result.status === 'FAILED') {
        status = 'failed'
      }

      return {
        transactionId: result.externalId,
        status,
        amount: parseFloat(result.amount),
        currency: result.currency,
        providerTransactionId: referenceId,
        providerReference: result.financialTransactionId,
        completedAt: status === 'completed' ? new Date() : undefined,
        failureReason: result.reason,
      }
    } catch (error) {
      console.error('MTN payment verification error:', error)
      throw new Error('Failed to verify payment status')
    }
  }

  /**
   * Check account balance (for admin/monitoring purposes)
   */
  async checkBalance(): Promise<{ availableBalance: number; currency: string }> {
    try {
      const token = await this.getAccessToken()
      const { baseUrl, collectionPrimaryKey } = PAYMENT_CONFIG.mtn

      const response = await fetch(
        `${baseUrl}/collection/v1_0/account/balance`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': PAYMENT_CONFIG.mtn.environment === 'sandbox' ? 'sandbox' : 'production',
            'Ocp-Apim-Subscription-Key': collectionPrimaryKey,
          },
        }
      )

      const result = await response.json()

      return {
        availableBalance: parseFloat(result.availableBalance),
        currency: result.currency,
      }
    } catch (error) {
      console.error('MTN balance check error:', error)
      throw new Error('Failed to check account balance')
    }
  }

  /**
   * Validate account holder (optional - check if phone number is valid)
   */
  async validateAccount(msisdn: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken()
      const { baseUrl, collectionPrimaryKey } = PAYMENT_CONFIG.mtn

      const formattedPhone = formatPhoneNumber(msisdn, 'mtn')

      const response = await fetch(
        `${baseUrl}/collection/v1_0/accountholder/msisdn/${formattedPhone}/active`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': PAYMENT_CONFIG.mtn.environment === 'sandbox' ? 'sandbox' : 'production',
            'Ocp-Apim-Subscription-Key': collectionPrimaryKey,
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('MTN account validation error:', error)
      return false
    }
  }
}

// Export singleton instance
export const mtnMomo = new MTNMomoService()
