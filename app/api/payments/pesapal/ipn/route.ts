// ============================================================================
// PESAPAL IPN (Instant Payment Notification) HANDLER
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTransactionStatus } from '@/lib/payments/pesapal'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const orderMerchantReference = searchParams.get('OrderMerchantReference')

    console.log('Pesapal IPN received:', { orderTrackingId, orderMerchantReference })

    if (!orderTrackingId) {
      return NextResponse.json({ error: 'Missing OrderTrackingId' }, { status: 400 })
    }

    // Get transaction status from Pesapal
    const status = await getTransactionStatus(orderTrackingId)

    console.log('IPN transaction status:', {
      orderTrackingId,
      merchantReference: status.merchant_reference,
      status: status.payment_status_description,
      statusCode: status.payment_status_code,
      confirmationCode: status.confirmation_code,
    })

    // Update transaction in database
    const supabase = await createClient()

    const paymentStatus =
      status.payment_status_code === '1'
        ? 'completed'
        : status.payment_status_code === '2'
        ? 'failed'
        : status.payment_status_code === '3'
        ? 'cancelled'
        : 'pending'

    const { data: transaction, error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        provider_reference: status.confirmation_code,
        payment_date: new Date(status.created_date),
        notes: status.payment_status_description,
      })
      .eq('provider_transaction_id', orderTrackingId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update transaction via IPN:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log('Transaction updated via IPN:', {
      transactionId: transaction.transaction_id,
      status: paymentStatus,
    })

    // If payment successful, update reservation status
    if (paymentStatus === 'completed' && transaction?.reservation_id) {
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
        })
        .eq('id', transaction.reservation_id)

      if (reservationError) {
        console.error('Failed to update reservation via IPN:', reservationError)
      } else {
        console.log('Reservation confirmed via IPN:', transaction.reservation_id)
      }
    }

    // Pesapal expects a 200 OK response
    return NextResponse.json({
      success: true,
      message: 'IPN processed successfully',
      orderTrackingId,
      status: paymentStatus,
    })
  } catch (error) {
    console.error('Pesapal IPN error:', error)
    return NextResponse.json(
      {
        error: 'IPN processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
