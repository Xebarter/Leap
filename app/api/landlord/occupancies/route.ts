// ============================================================================
// LANDLORD OCCUPANCY MANAGEMENT API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch occupied properties owned by the landlord
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch occupied properties owned by this landlord (host_id)
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        location,
        price_ugx,
        is_occupied,
        occupied_by,
        occupancy_start_date,
        occupancy_end_date,
        paid_months,
        last_payment_date,
        can_extend_occupancy,
        property_code,
        host_id,
        profiles:occupied_by (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('host_id', user.id)
      .eq('is_occupied', true)
      .order('occupancy_end_date', { ascending: true })

    if (error) {
      console.error('Error fetching landlord occupied properties:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, properties })
  } catch (error) {
    console.error('Error in GET /api/landlord/occupancies:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
