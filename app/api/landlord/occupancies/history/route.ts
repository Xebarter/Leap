// ============================================================================
// LANDLORD OCCUPANCY HISTORY API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get propertyId from query params (optional)
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    // Build query for history records of properties owned by this landlord
    let query = supabase
      .from('property_occupancy_history')
      .select(`
        *,
        property:property_id (
          id,
          title,
          location,
          property_code,
          host_id
        ),
        tenant:tenant_id (
          id,
          full_name,
          email
        ),
        extender:extended_by (
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    // If propertyId specified, filter by it
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: history, error } = await query

    if (error) {
      console.error('Error fetching landlord occupancy history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter to only include properties owned by this landlord
    const filteredHistory = history?.filter(
      (record: any) => record.property?.host_id === user.id
    ) || []

    return NextResponse.json({ success: true, history: filteredHistory })
  } catch (error) {
    console.error('Error in GET /api/landlord/occupancies/history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
