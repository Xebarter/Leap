// ============================================================================
// LANDLORD EXTEND PROPERTY OCCUPANCY API
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
    const { propertyId, additionalMonths, reason } = body

    if (!propertyId || !additionalMonths) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, additionalMonths' },
        { status: 400 }
      )
    }

    if (additionalMonths < 1 || additionalMonths > 12) {
      return NextResponse.json(
        { error: 'Additional months must be between 1 and 12' },
        { status: 400 }
      )
    }

    // Verify the property belongs to this landlord
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('host_id, title')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (property.host_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this property' },
        { status: 403 }
      )
    }

    // Call the database function to extend occupancy
    const { data, error } = await supabase.rpc('extend_property_occupancy', {
      p_property_id: propertyId,
      p_additional_months: additionalMonths,
      p_extended_by: user.id,
      p_extension_reason: reason || null
    })

    if (error) {
      console.error('Error extending occupancy:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully extended occupancy by ${additionalMonths} month(s)`
    })
  } catch (error) {
    console.error('Error in POST /api/landlord/occupancies/extend:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
