// ============================================================================
// PAYMENT VERIFICATION API ENDPOINT
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/payments'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { transactionId, providerTransactionId, provider } = body

    // Validate required fields
    if ((!transactionId && !providerTransactionId) || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId or providerTransactionId, and provider' },
        { status: 400 }
      )
    }

    // Validate provider
    if (provider !== 'airtel' && provider !== 'mtn') {
      return NextResponse.json(
        { error: 'Invalid provider. Must be either "airtel" or "mtn"' },
        { status: 400 }
      )
    }

    // Use providerTransactionId if available, otherwise use our transactionId
    const verificationId = providerTransactionId || transactionId

    // Verify payment with provider
    const verification = await paymentService.verifyPayment(verificationId, provider)

    // Update transaction status in database
    if (transactionId) {
      await paymentService.updateTransactionStatus(transactionId, verification.status, {
        providerTransactionId: verification.providerTransactionId,
        providerReference: verification.providerReference,
        failureReason: verification.failureReason,
      })

      // If payment is completed, update the reservation/booking and mark property as occupied
      if (verification.status === 'completed') {
        // Get the transaction to find the reservation
        const transaction = await paymentService.getTransaction(transactionId)
        if (transaction?.reservation_id) {
          await paymentService.updateReservationPayment(
            transaction.reservation_id,
            'paid',
            transactionId
          )
        }
        
        // Mark property as occupied if property_id and months_paid are available
        if (transaction?.property_id && transaction?.months_paid) {
          const supabase = await createClient()
          
          // Call the database function to mark property as occupied
          const { error: occupancyError } = await supabase.rpc('mark_property_as_occupied', {
            p_property_id: transaction.property_id,
            p_tenant_id: user.id,
            p_months_paid: transaction.months_paid,
            p_amount_paid: transaction.amount_paid_ugx,
            p_payment_transaction_id: transaction.id
          })
          
          if (occupancyError) {
            console.error('Failed to mark property as occupied:', occupancyError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: verification.transactionId,
      status: verification.status,
      amount: verification.amount,
      currency: verification.currency,
      providerTransactionId: verification.providerTransactionId,
      providerReference: verification.providerReference,
      completedAt: verification.completedAt,
      failureReason: verification.failureReason,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
