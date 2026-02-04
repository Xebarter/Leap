// ============================================================================
// OCCUPANCY HISTORY API
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get propertyId from query params
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    let query = supabase
      .from('property_occupancy_history')
      .select(`
        *,
        property:property_id (
          id,
          title,
          location,
          property_code
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

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data: history, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching occupancy history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error('Error in GET /api/admin/occupancies/history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
