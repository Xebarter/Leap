// Types for Apartment Property Editor

import { FloorUnitTypeConfiguration, UnitTypeDetails, FloorConfig } from '../floor-unit-type-configurator'

export interface ApartmentFormData {
  // Block/Building identification
  blockId?: string
  
  // Building Information
  buildingName: string
  location: string
  googleMapsEmbedUrl?: string
  
  // Building Media
  buildingImageUrl?: string
  buildingImageUrls?: string[]
  buildingVideoUrl?: string
  
  // Floor Configuration
  totalFloors: number
  floorConfig: FloorConfig[]
  
  // Unit Type Details (each becomes a separate property listing)
  unitTypeDetails: UnitTypeDetails[]
  
  // Settings
  minimumInitialMonths: number
  isActive?: boolean
}

export interface ApartmentEditorSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  isComplete: (data: ApartmentFormData) => boolean
  hasErrors: (errors: ApartmentValidationErrors) => boolean
}

export interface ApartmentValidationErrors {
  buildingName?: string
  location?: string
  totalFloors?: string
  floorConfig?: string
  unitTypeDetails?: string
  minimumInitialMonths?: string
  [key: string]: string | undefined
}

export interface ApartmentSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

// Summary statistics for the building
export interface BuildingSummary {
  totalFloors: number
  totalUnits: number
  unitTypeBreakdown: Array<{
    type: string
    label: string
    count: number
    priceRange: { min: number; max: number }
  }>
  floorsConfigured: number
}

export const DEFAULT_APARTMENT_FORM_DATA: ApartmentFormData = {
  buildingName: '',
  location: '',
  googleMapsEmbedUrl: '',
  buildingImageUrl: '',
  buildingImageUrls: [],
  buildingVideoUrl: '',
  totalFloors: 5,
  floorConfig: [],
  unitTypeDetails: [],
  minimumInitialMonths: 1,
  isActive: true,
}

// Helper to create initial floor config
export function createInitialFloorConfig(totalFloors: number): FloorConfig[] {
  return Array.from({ length: totalFloors }, (_, i) => ({
    floorNumber: i + 1,
    unitTypes: [{ type: '1BR', count: 1, monthlyFee: 1000000 }]
  }))
}

// Helper to get unique unit types from floor config
export function getUniqueUnitTypes(floorConfig: FloorConfig[]): string[] {
  const types = new Set<string>()
  floorConfig.forEach(floor => {
    floor.unitTypes.forEach(ut => types.add(ut.type))
  })
  return Array.from(types).sort()
}

// Helper to calculate building summary
export function calculateBuildingSummary(formData: ApartmentFormData): BuildingSummary {
  const unitTypeBreakdown: Map<string, { count: number; prices: number[] }> = new Map()
  
  formData.floorConfig.forEach(floor => {
    floor.unitTypes.forEach(ut => {
      const existing = unitTypeBreakdown.get(ut.type) || { count: 0, prices: [] }
      existing.count += ut.count
      if (ut.monthlyFee > 0) {
        existing.prices.push(ut.monthlyFee)
      }
      unitTypeBreakdown.set(ut.type, existing)
    })
  })
  
  const breakdown = Array.from(unitTypeBreakdown.entries()).map(([type, data]) => {
    const unitDetail = formData.unitTypeDetails.find(d => d.type === type)
    const prices = data.prices.length > 0 ? data.prices : [0]
    return {
      type,
      label: getUnitTypeLabel(type),
      count: data.count,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    }
  })
  
  return {
    totalFloors: formData.totalFloors,
    totalUnits: breakdown.reduce((sum, b) => sum + b.count, 0),
    unitTypeBreakdown: breakdown,
    floorsConfigured: formData.floorConfig.filter(f => f.unitTypes.length > 0).length
  }
}

// Unit type labels
export function getUnitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'Studio': 'Studio',
    '1BR': '1 Bedroom',
    '2BR': '2 Bedroom',
    '3BR': '3 Bedroom',
    '4BR': '4 Bedroom',
    'Penthouse': 'Penthouse'
  }
  return labels[type] || type
}

// Unit type colors for visual distinction
export const UNIT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Studio': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500' },
  '1BR': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
  '2BR': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
  '3BR': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500' },
  '4BR': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-500' },
  'Penthouse': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-500' },
}
