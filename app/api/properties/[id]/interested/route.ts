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
    const body = await request.json()
    const { email, phone, name, message } = body

    console.log('Express Interest Request:', { propertyId, userId: user?.id, email, hasUser: !!user })

    // For authenticated users, email is optional (we use their account email)
    // For anonymous users, we require an email

    // Check if property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('id', propertyId)
      .single()

    if (propertyError) {
      console.error('Error fetching property:', propertyError)
      return NextResponse.json(
        { error: 'Property not found', details: propertyError.message },
        { status: 404 }
      )
    }

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if user/email already expressed interest
    let existingQuery = supabase
      .from('property_interested')
      .select('id, status')
      .eq('property_id', propertyId)

    if (user) {
      existingQuery = existingQuery.eq('user_id', user.id)
    } else {
      existingQuery = existingQuery.eq('email', email)
    }

    const { data: existingInterest } = await existingQuery.single()

    if (existingInterest) {
      // Update existing interest
      const { data: updated, error: updateError } = await supabase
        .from('property_interested')
        .update({
          phone: phone || null,
          name: name || null,
          message: message || null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInterest.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating interest:', updateError)
        return NextResponse.json(
          { error: 'Failed to update interest' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Interest updated successfully',
        isNew: false,
        interest: updated
      })
    }

    // Create new interest record
    const insertData = {
      property_id: propertyId,
      user_id: user?.id || null,
      email: email || user?.email || null,
      phone: phone || null,
      name: name || null,
      message: message || null,
      status: 'active',
      interested_at: new Date().toISOString()
    }

    console.log('Attempting to insert interest:', insertData)

    const { data: interest, error: interestError } = await supabase
      .from('property_interested')
      .insert(insertData)
      .select()
      .single()

    if (interestError) {
      console.error('Error recording interest:', interestError)
      console.error('Error details:', JSON.stringify(interestError, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to record interest', 
          details: interestError.message,
          hint: interestError.hint || 'Check if property_interested table exists',
          code: interestError.code
        },
        { status: 500 }
      )
    }

    // Get updated counts
    const { data: updatedProperty } = await supabase
      .from('properties')
      .select('interested_count')
      .eq('id', propertyId)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Interest recorded successfully',
      isNew: true,
      interest,
      interestedCount: updatedProperty?.interested_count || 0
    })

  } catch (error) {
    console.error('Error in interest tracking:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has expressed interest
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: propertyId } = await context.params

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: true,
        hasExpressedInterest: false
      })
    }

    // Check if user has expressed interest
    const { data: interest } = await supabase
      .from('property_interested')
      .select('id, status, interested_at')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      hasExpressedInterest: !!interest,
      interest: interest || null
    })

  } catch (error) {
    console.error('Error checking interest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove interest
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: propertyId } = await context.params

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete interest
    const { error: deleteError } = await supabase
      .from('property_interested')
      .delete()
      .eq('property_id', propertyId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error removing interest:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove interest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Interest removed successfully'
    })

  } catch (error) {
    console.error('Error removing interest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
