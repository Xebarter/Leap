// ============================================================================
// CANCEL PROPERTY OCCUPANCY API
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
    const { propertyId, reason } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Missing required field: propertyId' },
        { status: 400 }
      )
    }

    // Update property to mark as available
    const { error: propertyError } = await supabase
      .from('properties')
      .update({
        is_occupied: false,
        occupied_by: null,
        occupancy_start_date: null,
        occupancy_end_date: null,
        paid_months: 0,
        last_payment_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)

    if (propertyError) {
      console.error('Error cancelling occupancy:', propertyError)
      return NextResponse.json({ error: propertyError.message }, { status: 500 })
    }

    // Update occupancy history status
    const { error: historyError } = await supabase
      .from('property_occupancy_history')
      .update({
        status: 'cancelled',
        extension_reason: reason || 'Cancelled by admin',
        updated_at: new Date().toISOString()
      })
      .eq('property_id', propertyId)
      .in('status', ['active', 'extended'])

    if (historyError) {
      console.error('Error updating history:', historyError)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully cancelled occupancy'
    })
  } catch (error) {
    console.error('Error in POST /api/admin/occupancies/cancel:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
