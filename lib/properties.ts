import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Create a singleton Supabase admin client for server-side operations
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Add keep-alive and timeout settings to prevent ECONNRESET
          keepalive: true,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        })
      },
    },
  })

  return supabaseAdmin
}

export interface PropertyDetailImage {
  id: string
  property_detail_id: string
  image_url: string
  display_order: number
}

export interface PropertyDetail {
  id: string
  property_id: string
  detail_type: string
  detail_name: string
  description: string | null
  images?: PropertyDetailImage[]
}

// Property images stored directly on the property (from apartment wizard)
export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  area: string
  display_order: number
  is_primary: boolean
}

export interface PropertyData {
  id: string
  property_code?: string  // Unique 10-digit identifier for the property listing
  title: string
  location: string | null
  price_ugx: number
  image_url: string | null
  category: string
  bedrooms: number
  bathrooms: number
  description: string | null
  video_url: string | null
  rating: number
  reviews_count: number
  is_active: boolean
  is_featured?: boolean  // Flag to mark property for display on landing page
  created_at: string
  updated_at: string
  // Location mapping
  google_maps_embed_url?: string | null
  // Additional fields from apartment wizard
  unit_type?: string
  block_id?: string
  total_floors?: number
  units_config?: string
  floor_unit_config?: any  // JSONB configuration for floor-based unit types
  features?: string[]
  amenities?: string[]
  area_sqm?: number
  minimum_initial_months?: number
  pet_policy?: string
  utilities_included?: string[]
  available_from?: string
  property_blocks?: {
    id: string
    name: string
    location: string
    total_floors: number
    total_units: number
  } | Array<{
    id: string
    name: string
    location: string
    total_floors: number
    total_units: number
  }>
  property_units?: Array<{
    id: string
    block_id: string
    floor_number: number
    unit_number: string
    unit_type?: string
    bedrooms: number
    bathrooms: number
    is_available: boolean
    price_ugx?: number
  }>
  property_details?: PropertyDetail[]
  // Property images from property_images table
  property_images?: PropertyImage[]
}

// Helper function to retry failed queries
async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries: number = 3,
  delay: number = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError: any
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn()
      
      // If successful or error is not a connection error, return immediately
      if (!result.error || !result.error.message?.includes('fetch failed')) {
        return result
      }
      
      lastError = result.error
      
      // Wait before retrying (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    } catch (err) {
      lastError = err
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  return { data: null, error: lastError }
}

export async function getPublicProperties(): Promise<PropertyData[]> {
  try {
    console.log('getPublicProperties: Starting...')
    
    const supabase = getSupabaseAdmin()
    
    console.log('getPublicProperties: Fetching active properties from Supabase...')
    
    // Fetch properties with all relevant fields including apartment wizard data
    // Note: property_code and google_maps_embed_url may not exist in older databases - they're optional
    // First try without property_code to ensure backwards compatibility
    // Only show properties that are not occupied (is_occupied = false or null)
    const { data, error } = await retryQuery(() => 
      supabase
        .from('properties')
        .select(`
          id,
          title,
          location,
          price_ugx,
          image_url,
          category,
          bedrooms,
          bathrooms,
          description,
          video_url,
          rating,
          reviews_count,
          is_active,
          created_at,
          updated_at,
          block_id,
          total_floors,
          units_config,
          amenities,
          minimum_initial_months,
          property_blocks (
            id,
            name,
            location,
            total_floors,
            total_units
          ),
          property_images (
            id,
            property_id,
            image_url,
            area,
            display_order,
            is_primary
          )
        `)
        .eq('is_active', true)
        .or('is_occupied.is.null,is_occupied.eq.false')
        .order('created_at', { ascending: false })
    )
    
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)
      console.error('Error fetching properties from Supabase:', errorMessage)
      
      // If error is due to missing property_code or google_maps_embed_url column, try without them
      if (errorMessage.includes('property_code') || errorMessage.includes('google_maps_embed_url')) {
        console.log('Column not found, retrying without optional columns...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            location,
            price_ugx,
            image_url,
            category,
            bedrooms,
            bathrooms,
            description,
            video_url,
            rating,
            reviews_count,
            is_active,
            created_at,
            updated_at,
            block_id,
            total_floors,
            units_config,
            amenities,
            minimum_initial_months,
            property_blocks (
              id,
              name,
              location,
              total_floors,
              total_units
            ),
            property_images (
              id,
              property_id,
              image_url,
              area,
              display_order,
              is_primary
            )
          `)
          .eq('is_active', true)
          .or('is_occupied.is.null,is_occupied.eq.false')
          .order('created_at', { ascending: false })
        
        if (!fallbackError) {
          console.log('Successfully fetched properties (fallback):', fallbackData?.length || 0)
          return fallbackData || []
        }
      }
      
      return []
    }
    
    console.log('Successfully fetched properties:', data?.length || 0, 'properties')
    return data || []
  } catch (error) {
    console.error('❌ Exception in getPublicProperties:', error instanceof Error ? error.message : error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    return []
  }
}

export async function getPropertyById(id: string): Promise<PropertyData | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_blocks (
          id,
          name,
          location,
          total_floors,
          total_units,
          property_units (
            id,
            block_id,
            floor_number,
            unit_number,
            unit_type,
            bedrooms,
            bathrooms,
            is_available,
            price_ugx,
            property_id,
            is_occupied
          )
        ),
        property_units!left (
          id,
          block_id,
          floor_number,
          unit_number,
          unit_type,
          bedrooms,
          bathrooms,
          is_available,
          price_ugx,
          property_id,
          is_occupied
        ),
        property_images (
          id,
          property_id,
          image_url,
          area,
          display_order,
          is_primary
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)
      console.error('Error fetching property:', errorMessage)
      return null
    }
    
    // Fetch property details with images (for legacy/manual property details)
    const { data: detailsData, error: detailsError } = await supabase
      .from('property_details')
      .select('*')
      .eq('property_id', id)
      .order('detail_type')
    
    if (detailsError) {
      const errorMessage = typeof detailsError === 'object' && detailsError !== null ? JSON.stringify(detailsError) : String(detailsError)
      console.error('Error fetching property details:', errorMessage)
    }
    
    // Fetch images for each detail
    const propertyDetails: PropertyDetail[] = []
    if (detailsData && detailsData.length > 0) {
      for (const detail of detailsData) {
        const { data: imagesData, error: imagesError } = await supabase
          .from('property_detail_images')
          .select('*')
          .eq('property_detail_id', detail.id)
          .order('display_order', { ascending: true })
        
        if (!imagesError) {
          propertyDetails.push({
            ...detail,
            images: imagesData || []
          })
        } else {
          propertyDetails.push({
            ...detail,
            images: []
          })
        }
      }
    }

    // If property has a block_id, fetch ALL units from that block (not just current property's units)
    if (data && data.block_id) {
      const { data: allBlockUnits, error: unitsError } = await supabase
        .from('property_units')
        .select('*')
        .eq('block_id', data.block_id)
        .order('floor_number', { ascending: false })
        .order('unit_number', { ascending: true })

      if (!unitsError && allBlockUnits && data.property_blocks) {
        // Replace the nested units with ALL units from the block
        if (Array.isArray(data.property_blocks)) {
          data.property_blocks[0].property_units = allBlockUnits
        } else {
          data.property_blocks.property_units = allBlockUnits
        }
      }
    }

    // Sort property_images by display_order if they exist
    const sortedPropertyImages = data.property_images 
      ? [...data.property_images].sort((a, b) => a.display_order - b.display_order)
      : []
    
    return {
      ...data,
      property_details: propertyDetails,
      property_images: sortedPropertyImages
    }
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)
    console.error('Error in getPropertyById:', errorMessage)
    return null
  }
}

export async function getFeaturedProperties(limit: number = 6): Promise<PropertyData[]> {
  try {
    console.log('getFeaturedProperties: Fetching featured properties...')
    
    const supabase = getSupabaseAdmin()
    
    // Try to fetch featured properties (exclude occupied properties)
    const { data, error } = await retryQuery(() =>
      supabase
        .from('properties')
        .select(`
          id,
          title,
          location,
          price_ugx,
          image_url,
          category,
          bedrooms,
          bathrooms,
          description,
          video_url,
          rating,
          reviews_count,
          is_active,
          is_featured,
          created_at,
          updated_at,
          block_id,
          total_floors,
          units_config,
          amenities,
          minimum_initial_months,
          property_blocks (
            id,
            name,
            location,
            total_floors,
            total_units
          ),
          property_images (
            id,
            property_id,
            image_url,
            area,
            display_order,
            is_primary
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .or('is_occupied.is.null,is_occupied.eq.false')
        .order('created_at', { ascending: false })
        .limit(limit)
    )
    
    if (error) {
      const errorMessage = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)
      console.error('Error fetching featured properties:', errorMessage)
      
      // If is_featured column doesn't exist, fall back to returning latest properties
      if (errorMessage.includes('is_featured')) {
        console.log('is_featured column not found, falling back to latest properties...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            location,
            price_ugx,
            image_url,
            category,
            bedrooms,
            bathrooms,
            description,
            video_url,
            rating,
            reviews_count,
            is_active,
            created_at,
            updated_at,
            block_id,
            total_floors,
            units_config,
            amenities,
            minimum_initial_months,
            property_blocks (
              id,
              name,
              location,
              total_floors,
              total_units
            ),
            property_images (
              id,
              property_id,
              image_url,
              area,
              display_order,
              is_primary
            )
          `)
          .eq('is_active', true)
          .or('is_occupied.is.null,is_occupied.eq.false')
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (!fallbackError) {
          console.log('Successfully fetched properties (fallback):', fallbackData?.length || 0)
          return fallbackData || []
        }
      }
      
      return []
    }
    
    console.log('Successfully fetched featured properties:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ Exception in getFeaturedProperties:', error instanceof Error ? error.message : error)
    return []
  }
}