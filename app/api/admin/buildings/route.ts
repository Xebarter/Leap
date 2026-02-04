import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/admin/buildings
 * Fetch all property blocks (buildings) with their units and statistics
 */
export async function GET(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error - missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const location = searchParams.get('location')

    // Build query for property_blocks
    let query = supabaseAdmin
      .from('property_blocks')
      .select(`
        id,
        name,
        location,
        description,
        total_floors,
        total_units,
        block_image_url,
        created_by,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    const { data: blocks, error: blocksError } = await query

    if (blocksError) {
      console.error('Error fetching property blocks:', blocksError)
      return NextResponse.json(
        { error: blocksError.message },
        { status: 500 }
      )
    }

    // For each block, fetch related statistics and complete data
    const blocksWithStats = await Promise.all(
      (blocks || []).map(async (block) => {
        // Get all properties in this block with complete information including floor_unit_config
        const { data: properties, error: propsError } = await supabaseAdmin
          .from('properties')
          .select(`
            id, 
            title, 
            category, 
            price_ugx, 
            bedrooms, 
            bathrooms, 
            is_active, 
            image_url,
            floor_unit_config,
            description,
            amenities,
            features,
            total_floors,
            images
          `)
          .eq('block_id', block.id)

        // Get all units in this block with complete details
        const { data: units, error: unitsError } = await supabaseAdmin
          .from('property_units')
          .select(`
            id, 
            floor_number, 
            unit_number, 
            unit_type, 
            bedrooms, 
            bathrooms, 
            is_available, 
            price_ugx,
            area_sqft,
            template_name,
            features,
            sync_with_template
          `)
          .eq('block_id', block.id)
          .order('floor_number', { ascending: true })
          .order('unit_number', { ascending: true })

        // Group units by floor for better organization
        const unitsByFloor: Record<number, any[]> = {}
        units?.forEach(unit => {
          if (!unitsByFloor[unit.floor_number]) {
            unitsByFloor[unit.floor_number] = []
          }
          unitsByFloor[unit.floor_number].push(unit)
        })

        // Get unique unit types from units (more accurate than from properties)
        const unitTypesFromUnits = [...new Set(units?.map(u => u.unit_type).filter(Boolean) || [])]
        
        // Group units by template/type for summary
        const unitTypesSummary = units?.reduce((acc: any, unit) => {
          const key = unit.template_name || `${unit.unit_type}_${unit.bedrooms}BR`
          if (!acc[key]) {
            acc[key] = {
              type: unit.unit_type,
              bedrooms: unit.bedrooms,
              bathrooms: unit.bathrooms,
              price_ugx: unit.price_ugx,
              count: 0,
              available: 0,
              occupied: 0,
              units: []
            }
          }
          acc[key].count++
          if (unit.is_available) {
            acc[key].available++
          } else {
            acc[key].occupied++
          }
          acc[key].units.push(unit.unit_number)
          return acc
        }, {})

        // Calculate statistics
        const totalProperties = properties?.length || 0
        const totalUnits = units?.length || 0
        const availableUnits = units?.filter(u => u.is_available).length || 0
        const occupiedUnits = totalUnits - availableUnits

        // Calculate price range from units (more accurate)
        const unitPrices = units?.map(u => u.price_ugx).filter(Boolean) || []
        const priceRange = unitPrices.length > 0
          ? {
              min: Math.min(...unitPrices),
              max: Math.max(...unitPrices)
            }
          : null

        return {
          ...block,
          statistics: {
            totalProperties,
            totalUnits,
            availableUnits,
            occupiedUnits,
            occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
            unitTypes: unitTypesFromUnits,
            priceRange
          },
          properties: properties || [],
          units: units || [],
          unitsByFloor,
          unitTypesSummary: Object.entries(unitTypesSummary || {}).map(([key, value]: [string, any]) => ({
            templateName: key,
            ...(value as object)
          }))
        }
      })
    )

    return NextResponse.json({
      buildings: blocksWithStats,
      total: blocksWithStats.length
    })

  } catch (error) {
    console.error('Error in GET /api/admin/buildings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch buildings' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/buildings/:id
 * Delete a property block and all its associated data
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('id')

    if (!blockId) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First, get all properties associated with this block
    const { data: properties, error: propertiesError } = await supabaseAdmin
      .from('properties')
      .select('id')
      .eq('block_id', blockId)

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError)
      return NextResponse.json(
        { error: propertiesError.message },
        { status: 500 }
      )
    }

    // Delete all associated properties (this will cascade delete property_units due to ON DELETE CASCADE)
    if (properties && properties.length > 0) {
      const propertyIds = properties.map(p => p.id)
      
      const { error: deletePropertiesError } = await supabaseAdmin
        .from('properties')
        .delete()
        .in('id', propertyIds)

      if (deletePropertiesError) {
        console.error('Error deleting properties:', deletePropertiesError)
        return NextResponse.json(
          { error: deletePropertiesError.message },
          { status: 500 }
        )
      }
    }

    // Delete the block (property_units with this block_id will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('property_blocks')
      .delete()
      .eq('id', blockId)

    if (deleteError) {
      console.error('Error deleting block:', deleteError)
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Building and all associated properties and units deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/buildings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete building' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/buildings
 * Update building information (basic info only, not units/floors)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, location, description, total_floors, block_image_url } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Building ID is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update the building in property_blocks table
    const { data: updatedBlock, error: updateError } = await supabaseAdmin
      .from('property_blocks')
      .update({
        name,
        location,
        description,
        total_floors,
        block_image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating building:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      building: updatedBlock,
      message: 'Building updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/buildings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update building' },
      { status: 500 }
    )
  }
}
