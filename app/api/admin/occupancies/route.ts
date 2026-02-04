// ============================================================================
// ADMIN OCCUPANCY MANAGEMENT API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all occupied properties with details
export async function GET(request: NextRequest) {
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

    // Fetch occupied properties with tenant details
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
        profiles:occupied_by (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('is_occupied', true)
      .order('occupancy_end_date', { ascending: true })

    if (error) {
      console.error('Error fetching occupied properties:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, properties })
  } catch (error) {
    console.error('Error in GET /api/admin/occupancies:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
