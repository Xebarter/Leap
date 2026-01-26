// ============================================================================
// UNIFIED PAYMENT SERVICE
// ============================================================================
// This service provides a unified interface for all payment operations

import { createClient } from '@/lib/supabase/server'
import { airtelMoney } from './airtel'
import { mtnMomo } from './mtn'
import type {
  PaymentRequest,
  PaymentResponse,
  PaymentVerification,
  PaymentTransaction,
  PaymentProvider,
  PaymentStatus,
} from './types'

export class PaymentService {
  /**
   * Process a payment using the specified provider
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Validate request
    if (!request.propertyCode || request.propertyCode.length !== 10) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Invalid property code. Must be a 10-digit number.',
      }
    }

    if (!request.phoneNumber) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Phone number is required.',
      }
    }

    if (request.amount <= 0) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: 'Invalid amount.',
      }
    }

    // Route to appropriate provider
    try {
      let response: PaymentResponse

      if (request.provider === 'airtel') {
        response = await airtelMoney.initiatePayment(request)
      } else if (request.provider === 'mtn') {
        response = await mtnMomo.initiatePayment(request)
      } else {
        return {
          success: false,
          transactionId: '',
          status: 'failed',
          message: 'Invalid payment provider.',
        }
      }

      return response
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment processing failed',
      }
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(
    transactionId: string,
    provider: PaymentProvider
  ): Promise<PaymentVerification> {
    try {
      if (provider === 'airtel') {
        return await airtelMoney.verifyPayment(transactionId)
      } else if (provider === 'mtn') {
        return await mtnMomo.verifyPayment(transactionId)
      } else {
        throw new Error('Invalid payment provider')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      throw error
    }
  }

  /**
   * Save payment transaction to database
   */
  async saveTransaction(
    transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          transaction_id: transaction.transaction_id,
          invoice_id: transaction.invoice_id,
          booking_id: transaction.booking_id,
          reservation_id: transaction.reservation_id,
          tenant_id: transaction.tenant_id,
          property_code: transaction.property_code,
          amount_paid_ugx: transaction.amount_paid_ugx,
          currency: transaction.currency,
          payment_date: transaction.payment_date.toISOString(),
          payment_method: transaction.payment_method,
          provider: transaction.provider,
          provider_transaction_id: transaction.provider_transaction_id,
          provider_reference: transaction.provider_reference,
          status: transaction.status,
          description: transaction.description,
          notes: transaction.notes,
          phone_number: transaction.phone_number,
          email: transaction.email,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, transactionId: data.id }
    } catch (error) {
      console.error('Save transaction error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save transaction',
      }
    }
  }

  /**
   * Update payment transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: PaymentStatus,
    providerData?: {
      providerTransactionId?: string
      providerReference?: string
      failureReason?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (providerData?.providerTransactionId) {
        updateData.provider_transaction_id = providerData.providerTransactionId
      }

      if (providerData?.providerReference) {
        updateData.provider_reference = providerData.providerReference
      }

      if (providerData?.failureReason) {
        updateData.notes = providerData.failureReason
      }

      if (status === 'completed') {
        updateData.payment_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('transaction_id', transactionId)

      if (error) {
        console.error('Database update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Update transaction status error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update transaction',
      }
    }
  }

  /**
   * Get payment transaction by ID
   */
  async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        ...data,
        payment_date: new Date(data.payment_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Get transaction error:', error)
      return null
    }
  }

  /**
   * Get payment transactions for a tenant
   */
  async getTenantTransactions(
    tenantId: string,
    limit: number = 50
  ): Promise<PaymentTransaction[]> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) {
        return []
      }

      return data.map((item) => ({
        ...item,
        payment_date: new Date(item.payment_date),
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      }))
    } catch (error) {
      console.error('Get tenant transactions error:', error)
      return []
    }
  }

  /**
   * Get payment transactions for a property
   */
  async getPropertyTransactions(
    propertyCode: string,
    limit: number = 50
  ): Promise<PaymentTransaction[]> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('property_code', propertyCode)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) {
        return []
      }

      return data.map((item) => ({
        ...item,
        payment_date: new Date(item.payment_date),
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      }))
    } catch (error) {
      console.error('Get property transactions error:', error)
      return []
    }
  }

  /**
   * Update reservation payment status
   */
  async updateReservationPayment(
    reservationId: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded',
    transactionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      const updateData: any = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }

      if (transactionId) {
        updateData.payment_reference = transactionId
      }

      if (paymentStatus === 'paid') {
        updateData.paid_at = new Date().toISOString()
        updateData.status = 'confirmed'
      }

      const { error } = await supabase
        .from('property_reservations')
        .update(updateData)
        .eq('id', reservationId)

      if (error) {
        console.error('Reservation update error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Update reservation payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update reservation',
      }
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
