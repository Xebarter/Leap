// Service functions for editing apartment properties
// Reconstructs full building configuration from individual unit type properties

import { createClient } from "@/lib/supabase/client"
import { FloorUnitTypeConfiguration, UnitTypeDetails } from "@/components/adminView/floor-unit-type-configurator"

export interface ApartmentBlockData {
  blockId: string
  blockName: string
  location: string
  totalFloors: number
  buildingName: string
  minimumInitialMonths: number
  floorConfig: FloorUnitTypeConfiguration
  allProperties: any[] // All properties in this block
  existingPropertyIds: string[] // IDs of all properties in this block
}

/**
 * Fetch all data needed to edit an apartment building
 * Loads all unit types from the same block
 */
export async function fetchApartmentBlockData(propertyId: string): Promise<ApartmentBlockData | null> {
  const supabase = createClient()
  
  // 1. Get the property and its block_id
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*, property_blocks(*)')
    .eq('id', propertyId)
    .single()
  
  if (propError || !property) {
    const errorMessage = typeof propError === 'object' && propError !== null ? JSON.stringify(propError) : String(propError)
    console.error('Error fetching property:', errorMessage)
    return null
  }
  
  if (!property.block_id) {
    console.log('Property has no block_id, not an apartment building')
    return null
  }
  
  // 2. Get all properties in the same block (all unit types)
  const { data: allProperties, error: propsError } = await supabase
    .from('properties')
    .select('*, property_units(*)')
    .eq('block_id', property.block_id)
    .order('created_at', { ascending: true })
  
  if (propsError || !allProperties || allProperties.length === 0) {
    const errorMessage = typeof propsError === 'object' && propsError !== null ? JSON.stringify(propsError) : String(propsError)
    console.error('Error fetching block properties:', errorMessage)
    return null
  }
  
  console.log(`Found ${allProperties.length} properties in block ${property.block_id}`)
  
  // 3. Get all units in the block to reconstruct floor configuration
  const { data: allUnits, error: unitsError } = await supabase
    .from('property_units')
    .select('*')
    .eq('block_id', property.block_id)
    .order('floor_number', { ascending: true })
    .order('unit_number', { ascending: true })
  
  if (unitsError) {
    const errorMessage = typeof unitsError === 'object' && unitsError !== null ? JSON.stringify(unitsError) : String(unitsError)
    console.error('Error fetching units:', errorMessage)
    return null
  }
  
  console.log(`Found ${allUnits?.length || 0} units in block`)
  
  // 4. Reconstruct floor configuration
  const floorConfig = await reconstructFloorConfig(
    allUnits || [],
    allProperties,
    property.property_blocks.total_floors
  )
  
  // 5. Extract building name from property titles
  const buildingName = extractBuildingName(allProperties)
  
  return {
    blockId: property.block_id,
    blockName: property.property_blocks.name,
    location: property.location,
    totalFloors: property.property_blocks.total_floors,
    buildingName,
    minimumInitialMonths: property.minimum_initial_months || 1,
    floorConfig,
    allProperties,
    existingPropertyIds: allProperties.map(p => p.id)
  }
}

/**
 * Reconstruct floor configuration from units and properties
 */
async function reconstructFloorConfig(
  units: any[],
  properties: any[],
  totalFloors: number
): Promise<FloorUnitTypeConfiguration> {
  const supabase = createClient()
  
  // Group units by floor and unit type
  const floorMap = new Map<number, Map<string, number>>()
  
  for (const unit of units) {
    if (!floorMap.has(unit.floor_number)) {
      floorMap.set(unit.floor_number, new Map())
    }
    const floorUnits = floorMap.get(unit.floor_number)!
    const unitType = unit.unit_type || extractUnitTypeFromTitle(unit.unit_number)
    floorUnits.set(unitType, (floorUnits.get(unitType) || 0) + 1)
  }
  
  // Build floor configurations
  const floors = []
  for (let floor = 1; floor <= totalFloors; floor++) {
    const floorUnits = floorMap.get(floor) || new Map()
    const unitTypes = []
    
    for (const [type, count] of floorUnits.entries()) {
      // Find the property for this unit type to get pricing
      const prop = properties.find(p => 
        p.title.includes(type) || 
        (p.bedrooms === getBedroomsForType(type) && unitTypeMatchesProperty(type, p))
      )
      
      unitTypes.push({
        type,
        count,
        monthlyFee: prop ? (prop.price_ugx / 100) : 1000000
      })
    }
    
    // If no units on this floor, add default
    if (unitTypes.length === 0) {
      unitTypes.push({ type: '1BR', count: 0, monthlyFee: 1000000 })
    }
    
    floors.push({
      floorNumber: floor,
      unitTypes
    })
  }
  
  // Build unit type details from properties
  const unitTypeDetails: UnitTypeDetails[] = []
  
  for (const property of properties) {
    const unitType = extractUnitTypeFromProperty(property)
    
    // Fetch property details (rooms with images)
    const { data: propertyDetails } = await supabase
      .from('property_details')
      .select('*')
      .eq('property_id', property.id)
    
    // Fetch images for each detail
    const detailsWithImages = []
    if (propertyDetails) {
      for (const detail of propertyDetails) {
        const { data: images } = await supabase
          .from('property_detail_images')
          .select('*')
          .eq('property_detail_id', detail.id)
          .order('display_order', { ascending: true })
        
        detailsWithImages.push({
          id: detail.id,
          type: detail.detail_type || 'room',
          name: detail.detail_name,
          description: detail.description || '',
          images: (images || []).map(img => ({
            id: img.id,
            url: img.image_url
          }))
        })
      }
    }
    
    // Fetch all property images
    const { data: propertyImages } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', property.id)
      .order('display_order', { ascending: true })
    
    const images = (propertyImages || []).map((img, idx) => ({
      id: img.id,
      url: img.image_url,
      category: img.category || 'general',
      isPrimary: img.is_primary || idx === 0,
      displayOrder: img.display_order || idx
    }))
    
    unitTypeDetails.push({
      type: unitType,
      title: property.title,
      description: property.description || '',
      priceUgx: property.price_ugx / 100,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      imageUrl: property.image_url,
      images,
      videoUrl: property.video_url || '',
      propertyDetails: detailsWithImages
    })
  }
  
  return {
    totalFloors,
    floors,
    unitTypeDetails
  }
}

/**
 * Extract unit type from property title or specifications
 */
function extractUnitTypeFromProperty(property: any): string {
  const title = property.title.toLowerCase()
  
  // Try to match unit type from title
  if (title.includes('studio')) return 'Studio'
  if (title.includes('penthouse')) return 'Penthouse'
  if (title.includes('4 bed') || title.includes('4br')) return '4BR'
  if (title.includes('3 bed') || title.includes('3br')) return '3BR'
  if (title.includes('2 bed') || title.includes('2br')) return '2BR'
  if (title.includes('1 bed') || title.includes('1br')) return '1BR'
  
  // Fall back to bedrooms count
  const bedrooms = property.bedrooms
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1BR'
  if (bedrooms === 2) return '2BR'
  if (bedrooms === 3) return '3BR'
  if (bedrooms >= 4) return '4BR'
  
  return '1BR'
}

/**
 * Extract unit type from unit number or title
 */
function extractUnitTypeFromTitle(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('studio')) return 'Studio'
  if (lower.includes('penthouse')) return 'Penthouse'
  if (lower.includes('4br') || lower.includes('4 bed')) return '4BR'
  if (lower.includes('3br') || lower.includes('3 bed')) return '3BR'
  if (lower.includes('2br') || lower.includes('2 bed')) return '2BR'
  if (lower.includes('1br') || lower.includes('1 bed')) return '1BR'
  return '1BR'
}

/**
 * Extract building name from property titles
 * Assumes format: "Building Name - Unit Type"
 */
function extractBuildingName(properties: any[]): string {
  if (properties.length === 0) return ''
  
  const firstTitle = properties[0].title
  const dashIndex = firstTitle.lastIndexOf(' - ')
  
  if (dashIndex > 0) {
    return firstTitle.substring(0, dashIndex).trim()
  }
  
  // Fall back to location if no dash found
  return properties[0].location
}

/**
 * Get bedrooms count for a unit type
 */
function getBedroomsForType(type: string): number {
  const map: Record<string, number> = {
    'Studio': 0,
    '1BR': 1,
    '2BR': 2,
    '3BR': 3,
    '4BR': 4,
    'Penthouse': 4
  }
  return map[type] ?? 1
}

/**
 * Check if unit type matches property specs
 */
function unitTypeMatchesProperty(type: string, property: any): boolean {
  const expectedBedrooms = getBedroomsForType(type)
  return property.bedrooms === expectedBedrooms
}
