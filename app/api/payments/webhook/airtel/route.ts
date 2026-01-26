// ============================================================================
// AIRTEL MONEY WEBHOOK HANDLER
// ============================================================================
// This endpoint receives payment callbacks from Airtel Money

import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/payments'
import type { AirtelWebhookPayload } from '@/lib/payments'

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload: AirtelWebhookPayload = await request.json()

    console.log('Airtel webhook received:', payload)

    // Extract transaction details
    const { transaction, reference } = payload

    // Map Airtel status to our internal status
    let status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' = 'pending'
    
    if (transaction.status === 'TS' || transaction.status === 'SUCCESS') {
      status = 'completed'
    } else if (transaction.status === 'TF' || transaction.status === 'FAILED') {
      status = 'failed'
    } else if (transaction.status === 'TP' || transaction.status === 'PENDING') {
      status = 'processing'
    }

    // Update transaction status
    await paymentService.updateTransactionStatus(reference, status, {
      providerTransactionId: transaction.id,
      failureReason: status === 'failed' ? transaction.message : undefined,
    })

    // If payment is completed, update the reservation
    if (status === 'completed') {
      const transactionRecord = await paymentService.getTransaction(reference)
      if (transactionRecord?.reservation_id) {
        await paymentService.updateReservationPayment(
          transactionRecord.reservation_id,
          'paid',
          reference
        )
      }
    } else if (status === 'failed') {
      const transactionRecord = await paymentService.getTransaction(reference)
      if (transactionRecord?.reservation_id) {
        await paymentService.updateReservationPayment(
          transactionRecord.reservation_id,
          'failed'
        )
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('Airtel webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
