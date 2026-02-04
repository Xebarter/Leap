import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: propertyId } = await context.params

    // Get user session (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Get request data
    const body = await request.json().catch(() => ({}))
    const sessionId = body.sessionId || crypto.randomUUID()

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Check if property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if this session already viewed today (prevent spam)
    const { data: existingView } = await supabase
      .from('property_views')
      .select('id')
      .eq('property_id', propertyId)
      .eq('session_id', sessionId)
      .gte('viewed_at', new Date().toISOString().split('T')[0]) // Today
      .single()

    if (existingView) {
      // Already viewed today by this session
      return NextResponse.json({
        success: true,
        message: 'View already recorded today',
        alreadyViewed: true
      })
    }

    // Record the view
    const { data: view, error: viewError } = await supabase
      .from('property_views')
      .insert({
        property_id: propertyId,
        viewer_id: user?.id || null,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        viewed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (viewError) {
      console.error('Error recording view:', viewError)
      return NextResponse.json(
        { error: 'Failed to record view', details: viewError.message },
        { status: 500 }
      )
    }

    // Get updated counts
    const { data: updatedProperty } = await supabase
      .from('properties')
      .select('daily_views_count, total_views_count, interested_count')
      .eq('id', propertyId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'View recorded successfully',
      sessionId,
      counts: updatedProperty
    })

  } catch (error) {
    console.error('Error in view tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch view counts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: propertyId } = await context.params

    // Get property with counts
    const { data: property, error } = await supabase
      .from('properties')
      .select('daily_views_count, total_views_count, interested_count, last_view_at')
      .eq('id', propertyId)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      counts: {
        dailyViews: property.daily_views_count || 0,
        totalViews: property.total_views_count || 0,
        interested: property.interested_count || 0,
        lastViewAt: property.last_view_at
      }
    })

  } catch (error) {
    console.error('Error fetching view counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
