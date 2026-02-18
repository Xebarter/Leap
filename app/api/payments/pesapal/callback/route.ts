// ============================================================================
// PESAPAL CALLBACK HANDLER
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTransactionStatus } from '@/lib/payments/pesapal'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const merchantReference = searchParams.get('OrderMerchantReference')

    console.log('Pesapal callback received:', { orderTrackingId, merchantReference })

    if (!orderTrackingId) {
      return NextResponse.redirect(
        new URL('/payment-failed?error=missing_tracking_id', request.url)
      )
    }

    // Get transaction status from Pesapal
    const status = await getTransactionStatus(orderTrackingId)

    console.log('Pesapal transaction status:', {
      orderTrackingId,
      status: status.payment_status_description,
      statusCode: status.payment_status_code,
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
      console.error('Failed to update transaction:', updateError)
    }

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
        console.error('Failed to update reservation:', reservationError)
      } else {
        console.log('Reservation confirmed:', transaction.reservation_id)
      }
    }

    // Redirect based on payment status
    if (paymentStatus === 'completed') {
      return NextResponse.redirect(
        new URL(`/payment-success?transaction=${merchantReference || orderTrackingId}`, request.url)
      )
    } else if (paymentStatus === 'failed') {
      return NextResponse.redirect(
        new URL(`/payment-failed?reason=${encodeURIComponent(status.payment_status_description)}`, request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL(`/payment-pending?transaction=${merchantReference || orderTrackingId}`, request.url)
      )
    }
  } catch (error) {
    console.error('Pesapal callback error:', error)
    return NextResponse.redirect(
      new URL('/payment-failed?error=callback_error', request.url)
    )
  }
}
