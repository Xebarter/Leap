// ============================================================================
// FREE PROPERTY OCCUPANCY API
// ============================================================================
// Handles occupancy for properties with 0 price (free properties)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { propertyId, propertyCode, monthsPaid, propertyTitle } = body

    if (!propertyId || !monthsPaid) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, monthsPaid' },
        { status: 400 }
      )
    }

    // Verify property exists and is free (price = 0)
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, price_ugx, is_occupied')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if property is already occupied
    if (property.is_occupied) {
      return NextResponse.json(
        { error: 'Property is already occupied' },
        { status: 400 }
      )
    }

    // Verify property is free (price is 0)
    if (property.price_ugx !== 0 && property.price_ugx !== null) {
      return NextResponse.json(
        { error: 'This property is not free. Please use the regular payment process.' },
        { status: 400 }
      )
    }

    // Call the database function to mark property as occupied
    const { error: occupancyError } = await supabase.rpc('mark_property_as_occupied', {
      p_property_id: propertyId,
      p_tenant_id: user.id,
      p_months_paid: monthsPaid,
      p_amount_paid: 0, // Free property
      p_payment_transaction_id: null // No payment transaction for free properties
    })

    if (occupancyError) {
      console.error('Failed to mark free property as occupied:', occupancyError)
      return NextResponse.json(
        { error: 'Failed to reserve property: ' + occupancyError.message },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Property reserved successfully',
      occupancyId: propertyId,
      propertyTitle: property.title,
      monthsPaid,
      amountPaid: 0,
    })
  } catch (error) {
    console.error('Free occupancy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
