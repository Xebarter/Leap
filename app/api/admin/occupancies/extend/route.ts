// ============================================================================
// EXTEND PROPERTY OCCUPANCY API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
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
    console.error('Error in POST /api/admin/occupancies/extend:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
