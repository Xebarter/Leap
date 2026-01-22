// Property image from property_images table
export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  area: string
  display_order: number
  is_primary: boolean
}

// Define the Property interface to match the data structure from the API
export interface Property {
  id: string
  property_code?: string  // Unique 10-digit identifier for the property listing
  title: string
  location: string
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
  // Additional fields from apartment wizard
  unit_type?: string
  block_id?: string
  total_floors?: number
  units_config?: string
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
  property_images?: PropertyImage[]
}

export interface PropertyFilterOptions {
  location: string
  priceMin: number
  priceMax: number
  bedrooms: string
  bathrooms: string
  category: string
  sortBy: string
}