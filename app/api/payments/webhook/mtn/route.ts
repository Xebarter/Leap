// ============================================================================
// MTN MOBILE MONEY WEBHOOK HANDLER
// ============================================================================
// This endpoint receives payment callbacks from MTN Mobile Money

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payments'
import type { MTNWebhookPayload } from '@/lib/payments'

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload: MTNWebhookPayload = await request.json()

    console.log('MTN webhook received:', payload)

    // Extract transaction details
    const { referenceId, status: mtnStatus, externalId, amount, currency, financialTransactionId, reason } = payload

    // Map MTN status to our internal status
    let status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' = 'pending'
    
    if (mtnStatus === 'SUCCESSFUL') {
      status = 'completed'
    } else if (mtnStatus === 'FAILED') {
      status = 'failed'
    } else if (mtnStatus === 'PENDING') {
      status = 'processing'
    }

    // Update transaction status using our internal transaction ID (externalId)
    await paymentService.updateTransactionStatus(externalId, status, {
      providerTransactionId: referenceId,
      providerReference: financialTransactionId,
      failureReason: reason,
    })

    // If payment is completed, update the reservation
    if (status === 'completed') {
      const transactionRecord = await paymentService.getTransaction(externalId)
      if (transactionRecord?.reservation_id) {
        await paymentService.updateReservationPayment(
          transactionRecord.reservation_id,
          'paid',
          externalId
        )
      }
    } else if (status === 'failed') {
      const transactionRecord = await paymentService.getTransaction(externalId)
      if (transactionRecord?.reservation_id) {
        await paymentService.updateReservationPayment(
          transactionRecord.reservation_id,
          'failed'
        )
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('MTN webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
