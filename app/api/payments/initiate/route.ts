// ============================================================================
// PAYMENT INITIATION API ENDPOINT
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentService } from '@/lib/payments'
import type { PaymentRequest } from '@/lib/payments'

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
    const {
      amount,
      phoneNumber,
      propertyCode,
      provider,
      email,
      firstName,
      lastName,
      description,
      reservationId,
      bookingId,
    } = body

    // Validate required fields
    if (!amount || !phoneNumber || !propertyCode || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, phoneNumber, propertyCode, provider' },
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

    // Validate property code
    if (!/^\d{10}$/.test(propertyCode)) {
      return NextResponse.json(
        { error: 'Invalid property code. Must be a 10-digit number' },
        { status: 400 }
      )
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      amount: parseInt(amount),
      phoneNumber,
      propertyCode,
      provider,
      email: email || user.email || undefined,
      firstName,
      lastName,
      description: description || `Payment for property ${propertyCode}`,
    }

    // Initiate payment
    const response = await paymentService.processPayment(paymentRequest)

    if (response.success) {
      // Save transaction to database
      const saveResult = await paymentService.saveTransaction({
        transaction_id: response.transactionId,
        reservation_id: reservationId,
        booking_id: bookingId,
        tenant_id: user.id,
        property_code: propertyCode,
        amount_paid_ugx: parseInt(amount),
        currency: 'UGX',
        payment_date: new Date(),
        payment_method: 'mobile_money',
        provider,
        provider_transaction_id: response.providerTransactionId,
        status: response.status,
        description: paymentRequest.description,
        phone_number: phoneNumber,
        email: paymentRequest.email,
      })

      if (!saveResult.success) {
        console.error('Failed to save transaction:', saveResult.error)
      }

      return NextResponse.json({
        success: true,
        transactionId: response.transactionId,
        providerTransactionId: response.providerTransactionId,
        status: response.status,
        message: response.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: response.message,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
