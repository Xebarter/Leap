// Types for Property Editor

export interface PropertyFormData {
  id?: string
  title: string
  location: string
  description: string
  price_ugx: number
  category: string
  bedrooms: number
  bathrooms: number
  image_url: string
  image_urls: string[]
  video_url: string
  minimum_initial_months: number
  total_floors: number
  units_config: string
  block_id?: string
  google_maps_embed_url?: string
  is_featured?: boolean
  property_code?: string
}

export interface EditorSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isComplete: (data: PropertyFormData) => boolean
  hasErrors: (errors: ValidationErrors) => boolean
}

export interface ValidationErrors {
  title?: string
  location?: string
  description?: string
  price_ugx?: string
  category?: string
  bedrooms?: string
  bathrooms?: string
  image_url?: string
  minimum_initial_months?: string
  [key: string]: string | undefined
}

export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

export const PROPERTY_CATEGORIES = [
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Townhouse', label: 'Townhouse' },
] as const

export const DEFAULT_FORM_DATA: PropertyFormData = {
  title: '',
  location: '',
  description: '',
  price_ugx: 0,
  category: '',
  bedrooms: 1,
  bathrooms: 1,
  image_url: '',
  image_urls: [],
  video_url: '',
  minimum_initial_months: 1,
  total_floors: 1,
  units_config: '',
  google_maps_embed_url: '',
  is_featured: false,
}
