// ============================================================================
// PESAPAL PAYMENT INITIATION API ENDPOINT
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { submitOrder, registerIPN, validatePesapalConfig } from '@/lib/payments/pesapal'
import { generateTransactionReference } from '@/lib/payments/config'

export async function POST(request: NextRequest) {
  try {
    // Validate Pesapal configuration
    const configValidation = validatePesapalConfig()
    if (!configValidation.valid) {
      console.error('Pesapal configuration errors:', configValidation.errors)
      return NextResponse.json(
        { error: 'Pesapal is not properly configured', details: configValidation.errors },
        { status: 500 }
      )
    }

    // Check authentication (optional for reservations)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse request body
    const body = await request.json()
    const {
      amount,
      email,
      phoneNumber,
      firstName,
      lastName,
      propertyCode,
      description,
      reservationId,
      propertyId,
    } = body

    // Validate required fields
    if (!amount || !email || !phoneNumber || !firstName || !lastName || !propertyCode) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['amount', 'email', 'phoneNumber', 'firstName', 'lastName', 'propertyCode'] 
        },
        { status: 400 }
      )
    }

    // Validate amount
    const amountNumber = parseFloat(amount)
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number' },
        { status: 400 }
      )
    }

    // Generate unique merchant reference
    const merchantReference = generateTransactionReference(propertyCode)

    // Register IPN (Instant Payment Notification) if not already registered
    // You might want to cache this or register once during setup
    let notificationId: string
    try {
      notificationId = await registerIPN()
      console.log('IPN registered successfully:', notificationId)
    } catch (error) {
      console.error('IPN registration failed:', error)
      // Continue anyway - IPN might already be registered
      // Use a default or cached notification ID
      notificationId = process.env.PESAPAL_IPN_ID || ''
    }

    // Create transaction record in database before submitting to Pesapal
    // Use admin client to bypass RLS since this is a system operation
    const adminSupabase = createAdminClient()
    const { data: transaction, error: dbError } = await adminSupabase
      .from('payment_transactions')
      .insert({
        transaction_id: merchantReference,
        reservation_id: reservationId || null,
        tenant_id: user?.id || null,
        property_code: propertyCode,
        property_id: propertyId || null,
        amount_paid_ugx: amountNumber,
        currency: 'UGX',
        payment_date: new Date().toISOString(),
        payment_method: 'pesapal',
        provider: 'pesapal',
        status: 'pending',
        description: description || `Reservation payment for property ${propertyCode}`,
        phone_number: phoneNumber,
        email: email,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create transaction record', details: dbError.message },
        { status: 500 }
      )
    }

    console.log('Transaction record created:', transaction.id)

    // Submit order to Pesapal
    try {
      const pesapalResponse = await submitOrder({
        merchantReference,
        amount: amountNumber,
        currency: 'UGX',
        description: description || `Reservation payment for property ${propertyCode}`,
        email,
        phoneNumber,
        firstName,
        lastName,
        notificationId,
      })

      // Update transaction with Pesapal order tracking ID
      await adminSupabase
        .from('payment_transactions')
        .update({
          provider_transaction_id: pesapalResponse.orderTrackingId,
          status: 'processing',
        })
        .eq('transaction_id', merchantReference)

      console.log('Payment initiated successfully:', {
        merchantReference,
        orderTrackingId: pesapalResponse.orderTrackingId,
      })

      return NextResponse.json({
        success: true,
        transactionId: merchantReference,
        orderTrackingId: pesapalResponse.orderTrackingId,
        redirectUrl: pesapalResponse.redirectUrl,
        message: 'Payment initiated successfully. Redirecting to Pesapal...',
      })
    } catch (pesapalError) {
      console.error('Pesapal order submission failed:', pesapalError)

      // Update transaction status to failed
      await adminSupabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          notes: pesapalError instanceof Error ? pesapalError.message : 'Unknown Pesapal error',
        })
        .eq('transaction_id', merchantReference)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to initiate payment with Pesapal',
          details: pesapalError instanceof Error ? pesapalError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate payment', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
