'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, Plus, Minus, Copy, Layers, FileText, ImageIcon, Upload, X, Loader2, Trash2, Check, Home
} from 'lucide-react'
import { generateUnitNumber } from '@/lib/unit-number-generator'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { UnitTypePropertyForm } from './unit-type-property-form'

// Unit type options with colors - Residential (Apartments, Hostels)
export const RESIDENTIAL_UNIT_TYPES = [
  { value: 'Studio', label: 'Studio', color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-500' },
  { value: '1BR', label: '1 Bedroom', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-500' },
  { value: '2BR', label: '2 Bedroom', color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-500' },
  { value: '3BR', label: '3 Bedroom', color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-500' },
  { value: '4BR', label: '4 Bedroom', color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', borderColor: 'border-rose-500' },
  { value: 'Penthouse', label: 'Penthouse', color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-500' },
]

// Office unit types - Commercial spaces
export const OFFICE_UNIT_TYPES = [
  { value: 'HotDesk', label: 'Hot Desk', color: 'bg-cyan-500', lightColor: 'bg-cyan-100', textColor: 'text-cyan-700', borderColor: 'border-cyan-500' },
  { value: 'DedicatedDesk', label: 'Dedicated Desk', color: 'bg-teal-500', lightColor: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-500' },
  { value: 'PrivateOffice', label: 'Private Office', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-500' },
  { value: 'TeamSuite', label: 'Team Suite', color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-500' },
  { value: 'ExecutiveOffice', label: 'Executive Office', color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-500' },
  { value: 'ConferenceRoom', label: 'Conference Room', color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', borderColor: 'border-rose-500' },
  { value: 'OpenSpace', label: 'Open Space', color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-500' },
  { value: 'VirtualOffice', label: 'Virtual Office', color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-500' },
]

// Legacy export for backward compatibility
export const UNIT_TYPES = RESIDENTIAL_UNIT_TYPES

// Helper to get unit types based on building type
export function getUnitTypesForBuilding(buildingType: string = 'apartment') {
  return buildingType === 'office' ? OFFICE_UNIT_TYPES : RESIDENTIAL_UNIT_TYPES
}

// Configuration for each unit type per floor
export interface UnitTypeConfig {
  type: string // e.g., "1BR", "2BR"
  count: number // How many units of this type on this floor
  monthlyFee: number // Rental fee in UGX (monthly for apartments/offices, per semester for hostels)
}

// Image for a unit type gallery
export interface UnitTypeImage {
  id: string
  url: string
  category: string // Kitchen, Bedroom, Bathroom, Living Room, etc.
  isPrimary: boolean
  displayOrder: number
}

// Complete property details for a unit type (each unit type = individual property listing)
export interface UnitTypeDetails {
  type: string // e.g., "1BR", "2BR" for residential, "PrivateOffice", "HotDesk" for office
  
  // Basic Property Info
  title?: string // Custom title for this listing
  description: string // Full property description
  
  // Pricing
  priceUgx?: number // Rent in UGX (monthly for apartments/offices, per semester for hostels)
  
  // Specifications - Residential
  area?: number // Area in m²
  bedrooms?: number // Number of bedrooms
  bathrooms?: number // Number of bathrooms
  
  // Specifications - Office/Commercial
  squareFootage?: number // Square footage for office spaces
  deskCapacity?: number // Number of desks/workstations
  parkingSpaces?: number // Allocated parking spaces
  meetingRooms?: number // Number of meeting rooms included
  has24x7Access?: boolean // 24/7 building access
  hasServerRoom?: boolean // Dedicated server room access
  hasReception?: boolean // Reception/front desk service
  hasKitchenette?: boolean // Kitchenette facilities
  
  // Media
  imageUrl?: string // Main image URL (backward compatibility)
  images?: UnitTypeImage[] // Multiple categorized images
  videoUrl?: string // Virtual tour or video URL
  
  // Features & Amenities
  features?: string[] // List of features (e.g., "Air Conditioning", "Balcony")
  amenities?: string[] // Building amenities (e.g., "Gym", "Pool", "Parking")
  
  // Additional Details
  floorPlanUrl?: string // Floor plan image
  availableFrom?: string // Availability date
  minLeaseTerm?: number // Minimum lease in months
  petPolicy?: string // Pet policy (residential)
  utilities?: string[] // Included utilities
  
  // Property details (rooms, areas with descriptions and images)
  propertyDetails?: Array<{
    id: string
    type: string
    name: string
    description?: string
    images?: Array<{
      id: string
      url: string
      file?: File
    }>
  }>
}

// Individual unit assignment
export interface UnitAssignment {
  id: string
  unitNumber: string
  floor: number
  unitType: string
  isAvailable: boolean
  syncWithTemplate: boolean // Whether this unit syncs with template
}

// Configuration for a single floor
export interface FloorConfig {
  floorNumber: number
  unitTypes: UnitTypeConfig[] // Array of unit types on this floor
}

// Complete building configuration (unified)
export interface FloorUnitTypeConfiguration {
  totalFloors: number
  floors: FloorConfig[]
  unitTypeDetails?: UnitTypeDetails[] // Descriptions for each unit type
  units?: UnitAssignment[] // Individual unit assignments (optional, for advanced management)
}

// Helper function to generate unique IDs
let idCounter = 0
function generateId() {
  idCounter++
  return `unit_${idCounter}_${Math.random().toString(36).substr(2, 9)}`
}

function getDefaultBedrooms(type: string): number {
  const map: Record<string, number> = { 'Studio': 0, '1BR': 1, '2BR': 2, '3BR': 3, '4BR': 4, 'Penthouse': 4 }
  return map[type] ?? 1
}

function getDefaultBathrooms(type: string): number {
  const map: Record<string, number> = { 'Studio': 1, '1BR': 1, '2BR': 2, '3BR': 2, '4BR': 3, 'Penthouse': 3 }
  return map[type] ?? 1
}

function getDefaultArea(type: string): number {
  const bedrooms = getDefaultBedrooms(type)
  return 40 + (bedrooms * 20)
}

interface FloorUnitTypeConfiguratorProps {
  totalFloors: number
  onChange: (config: FloorUnitTypeConfiguration) => void
  initialConfig?: FloorUnitTypeConfiguration
  propertyPrice?: number
  propertyBedrooms?: number
  propertyBathrooms?: number
  buildingName?: string
  buildingLocation?: string
  blockId?: string // Optional block ID for generating proper unit numbers
  buildingType?: string // 'apartment', 'hostel', or 'office'
}

function getUnitTypeInfo(type: string, buildingType: string = 'apartment') {
  const unitTypes = getUnitTypesForBuilding(buildingType)
  return unitTypes.find(t => t.value === type) || unitTypes[0]
}

export function FloorUnitTypeConfigurator({
  totalFloors,
  onChange,
  initialConfig,
  propertyPrice = 1000000,
  propertyBedrooms = 1,
  propertyBathrooms = 1,
  buildingName = '',
  buildingLocation = '',
  blockId,
  buildingType = 'apartment'
}: FloorUnitTypeConfiguratorProps) {
  
  // Get the appropriate unit types based on building type
  const unitTypes = useMemo(() => getUnitTypesForBuilding(buildingType), [buildingType])
  
  // Helper function to generate unit number (uses blockId if available, otherwise temporary format)
  const generateUnitNumberForUI = useCallback((floor: number, unitIndex: number): string => {
    if (blockId) {
      // Use proper 10-digit unit number generator
      return generateUnitNumber(blockId, floor, unitIndex);
    } else {
      // Use temporary placeholder format for UI (will be replaced on save)
      return `TEMP-${floor}-${String(unitIndex).padStart(3, '0')}`;
    }
  }, [blockId]);
  
  // Initialize floors configuration
  const [floors, setFloors] = useState<FloorConfig[]>(() => {
    if (initialConfig?.floors) {
      return initialConfig.floors
    }
    
    // Default: 1 unit of type "1BR" per floor with default monthly fee
    return Array.from({ length: totalFloors }, (_, i) => ({
      floorNumber: i + 1,
      unitTypes: [{ type: '1BR', count: 1, monthlyFee: propertyPrice }]
    }))
  })

  // Initialize unit type details (descriptions per unit type)
  const [unitTypeDetails, setUnitTypeDetails] = useState<UnitTypeDetails[]>(
    initialConfig?.unitTypeDetails || []
  )

  // Initialize individual units (for advanced unit management)
  const [units, setUnits] = useState<UnitAssignment[]>(
    initialConfig?.units || []
  )

  // Always manage individual units - this is now the only workflow
  const manageIndividualUnits = true

  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [copyFromFloor, setCopyFromFloor] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<string>('floors')
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [bulkAddCount, setBulkAddCount] = useState<number>(1)

  // Keep a ref to the onChange callback to avoid dependency issues
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Update parent whenever configuration changes
  React.useEffect(() => {
    onChangeRef.current({
      totalFloors,
      floors,
      unitTypeDetails,
      units: units // Always include units since individual unit management is now the only workflow
    })
  }, [floors, totalFloors, unitTypeDetails, units])

  // Generate units from floor configuration when enabling individual unit management
  const generateUnitsFromFloors = useCallback(() => {
    const newUnits: UnitAssignment[] = []
    
    for (const floor of floors) {
      let unitIndex = 1
      for (const ut of floor.unitTypes) {
        for (let i = 0; i < ut.count; i++) {
          newUnits.push({
            id: generateId(),
            unitNumber: generateUnitNumberForUI(floor.floorNumber, unitIndex),
            floor: floor.floorNumber,
            unitType: ut.type,
            isAvailable: true,
            syncWithTemplate: true
          })
          unitIndex++
        }
      }
    }
    
    setUnits(newUnits)
  }, [floors])

  // Initialize units from floors if not already present
  React.useEffect(() => {
    if (units.length === 0 && floors.length > 0) {
      generateUnitsFromFloors()
    }
  }, []) // Run only once on mount

  // Sync floors when totalFloors changes
  React.useEffect(() => {
    setFloors(prevFloors => {
      const newFloors = [...prevFloors]
      
      if (totalFloors > prevFloors.length) {
        // Add new floors
        for (let i = prevFloors.length + 1; i <= totalFloors; i++) {
          newFloors.push({
            floorNumber: i,
            unitTypes: [{ type: '1BR', count: 1, monthlyFee: 1000000 }]
          })
        }
      } else if (totalFloors < prevFloors.length) {
        // Remove floors
        return newFloors.slice(0, totalFloors)
      }
      
      return newFloors
    })
    
    // Adjust selected floor if needed
    if (selectedFloor > totalFloors) {
      setSelectedFloor(totalFloors)
    }
  }, [totalFloors])

  // Add a unit type to a floor
  const addUnitType = (floorNumber: number, type: string = '1BR') => {
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === floorNumber) {
          // Check if this type already exists
          const existingIndex = floor.unitTypes.findIndex(ut => ut.type === type)
          if (existingIndex >= 0) {
            // Increment count
            const newUnitTypes = [...floor.unitTypes]
            newUnitTypes[existingIndex] = {
              ...newUnitTypes[existingIndex],
              count: newUnitTypes[existingIndex].count + 1
            }
            return { ...floor, unitTypes: newUnitTypes }
          } else {
            // Add new type with default monthly fee
            return {
              ...floor,
              unitTypes: [...floor.unitTypes, { type, count: 1, monthlyFee: 1000000 }]
            }
          }
        }
        return floor
      })
    )
  }

  // Update unit type count
  const updateUnitTypeCount = (floorNumber: number, typeIndex: number, count: number) => {
    if (count < 0) return
    
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = [...floor.unitTypes]
          if (count === 0) {
            // Remove if count is 0
            newUnitTypes.splice(typeIndex, 1)
            // Ensure at least one unit type remains
            if (newUnitTypes.length === 0) {
              newUnitTypes.push({ type: '1BR', count: 1, monthlyFee: 1000000 })
            }
          } else {
            newUnitTypes[typeIndex] = { ...newUnitTypes[typeIndex], count }
          }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }

  // Update unit type monthly fee - also syncs to unit type details
  const updateUnitTypeMonthlyFee = (floorNumber: number, typeIndex: number, monthlyFee: number) => {
    if (monthlyFee < 0) return
    
    const currentFloor = floors.find(f => f.floorNumber === floorNumber)
    if (!currentFloor) return
    
    const unitType = currentFloor.unitTypes[typeIndex]?.type
    if (!unitType) return
    
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = [...floor.unitTypes]
          newUnitTypes[typeIndex] = { ...newUnitTypes[typeIndex], monthlyFee }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
    
    // Sync to unit type details pricing
    updateUnitTypeDetail(unitType, { priceUgx: monthlyFee })
  }

  // Get the monthly fee for a unit type (from the first floor that has it)
  const getUnitTypeMonthlyFee = (type: string): number => {
    for (const floor of floors) {
      const unitType = floor.unitTypes.find(ut => ut.type === type)
      if (unitType && unitType.monthlyFee > 0) {
        return unitType.monthlyFee
      }
    }
    return 0
  }

  // Update monthly fee for a unit type across all floors
  const updateUnitTypeMonthlyFeeAcrossAllFloors = useCallback((type: string, monthlyFee: number) => {
    if (monthlyFee < 0) return
    
    // Update all floors with this unit type
    setFloors(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        unitTypes: floor.unitTypes.map(ut =>
          ut.type === type ? { ...ut, monthlyFee } : ut
        )
      }))
    )
    
    // Update unit type details pricing
    setUnitTypeDetails(prev => {
      const existingIndex = prev.findIndex(d => d.type === type)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], priceUgx: monthlyFee }
        return updated
      }
      return prev
    })
  }, [])

  // Change unit type
  const changeUnitType = (floorNumber: number, typeIndex: number, newType: string) => {
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = [...floor.unitTypes]
          newUnitTypes[typeIndex] = { ...newUnitTypes[typeIndex], type: newType }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }

  // Remove a unit type from a floor
  const removeUnitType = (floorNumber: number, typeIndex: number) => {
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = floor.unitTypes.filter((_, idx) => idx !== typeIndex)
          // Ensure at least one unit type remains
          if (newUnitTypes.length === 0) {
            newUnitTypes.push({ type: '1BR', count: 1, monthlyFee: 1000000 })
          }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }

  // Copy configuration from one floor to another
  const copyFloorConfig = (fromFloor: number, toFloor: number) => {
    const sourceFloor = floors.find(f => f.floorNumber === fromFloor)
    if (!sourceFloor) return
    
    setFloors(prevFloors => 
      prevFloors.map(floor => {
        if (floor.floorNumber === toFloor) {
          return {
            ...floor,
            unitTypes: sourceFloor.unitTypes.map(ut => ({ ...ut }))
          }
        }
        return floor
      })
    )
  }

  // Apply configuration to all floors
  const applyToAllFloors = (floorNumber: number) => {
    const sourceFloor = floors.find(f => f.floorNumber === floorNumber)
    if (!sourceFloor) return
    
    setFloors(prevFloors => 
      prevFloors.map(floor => ({
        ...floor,
        unitTypes: sourceFloor.unitTypes.map(ut => ({ ...ut }))
      }))
    )
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const typeStats: Record<string, number> = {}
    let totalUnits = 0
    
    floors.forEach(floor => {
      floor.unitTypes.forEach(ut => {
        typeStats[ut.type] = (typeStats[ut.type] || 0) + ut.count
        totalUnits += ut.count
      })
    })
    
    return { typeStats, totalUnits }
  }, [floors])

  // Get unique unit types across all floors for the details tab
  const uniqueUnitTypes = useMemo(() => {
    const types = new Set<string>()
    floors.forEach(floor => {
      floor.unitTypes.forEach(ut => types.add(ut.type))
    })
    return Array.from(types).sort()
  }, [floors])

  // Get or create details for a unit type
  const getUnitTypeDetail = (type: string): UnitTypeDetails => {
    const existing = unitTypeDetails.find(d => d.type === type)
    // Always return a complete object with all fields properly initialized
    // This ensures controlled inputs never switch to uncontrolled
    // Use empty string for text fields, 0 or default values for numbers
    const defaults: UnitTypeDetails = {
      type, 
      description: '', 
      title: '',
      area: getDefaultArea(type),
      bedrooms: getDefaultBedrooms(type),
      bathrooms: getDefaultBathrooms(type),
      priceUgx: 0,
      features: [],
      amenities: [],
      utilities: [],
      videoUrl: '',
      availableFrom: '',
      petPolicy: '',
      minLeaseTerm: 1,
      images: [],
      propertyDetails: []
    }
    if (existing) {
      // Merge existing with defaults to ensure all fields exist
      return { ...defaults, ...existing }
    }
    return defaults
  }

  // Update unit type details
  const updateUnitTypeDetail = (type: string, updates: Partial<UnitTypeDetails>) => {
    setUnitTypeDetails(prev => {
      const existingIndex = prev.findIndex(d => d.type === type)
      
      // Create defaults for new entries
      // Use empty string for text fields, 0 or default values for numbers
      const defaults: UnitTypeDetails = {
        type, 
        description: '', 
        title: '',
        area: getDefaultArea(type),
        bedrooms: getDefaultBedrooms(type),
        bathrooms: getDefaultBathrooms(type),
        priceUgx: 0,
        features: [],
        amenities: [],
        utilities: [],
        videoUrl: '',
        availableFrom: '',
        petPolicy: '',
        minLeaseTerm: 1,
        images: [],
        propertyDetails: []
      }
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], ...updates }
        return updated
      } else {
        return [...prev, { ...defaults, ...updates }]
      }
    })
  }

  // Unit management functions
  const addUnit = useCallback((floor: number, unitType: string) => {
    setUnits(prev => {
      const floorUnits = prev.filter(u => u.floor === floor)
      const unitIndex = floorUnits.length + 1
      const unitNumber = generateUnitNumberForUI(floor, unitIndex)
      
      return [...prev, {
        id: generateId(),
        unitNumber,
        floor,
        unitType,
        isAvailable: true,
        syncWithTemplate: true
      }]
    })
  }, [generateUnitNumberForUI])

  const removeUnit = useCallback((unitId: string) => {
    setUnits(prev => {
      const unit = prev.find(u => u.id === unitId)
      if (!unit) return prev
      
      const newUnits = prev.filter(u => u.id !== unitId)
      // Renumber units on the same floor
      let floorCounter = 1
      return newUnits.map(u => {
        if (u.floor === unit.floor) {
          return { ...u, unitNumber: generateUnitNumberForUI(u.floor, floorCounter++) }
        }
        return u
      })
    })
  }, [generateUnitNumberForUI])

  const updateUnit = useCallback((unitId: string, updates: Partial<UnitAssignment>) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, ...updates } : u))
  }, [])

  const bulkAddUnits = useCallback((floor: number, count: number, unitType: string) => {
    setUnits(prev => {
      const newUnits = [...prev]
      const floorUnits = newUnits.filter(u => u.floor === floor)
      
      for (let i = 0; i < count; i++) {
        const unitIndex = floorUnits.length + i + 1
        newUnits.push({
          id: generateId(),
          unitNumber: generateUnitNumberForUI(floor, unitIndex),
          floor,
          unitType,
          isAvailable: true,
          syncWithTemplate: true
        })
      }
      
      return newUnits
    })
  }, [])

  // Units grouped by floor
  const unitsByFloor = useMemo(() => {
    const grouped: Record<number, UnitAssignment[]> = {}
    for (let floor = 1; floor <= totalFloors; floor++) {
      grouped[floor] = units
        .filter(u => u.floor === floor)
        .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
    }
    return grouped
  }, [units, totalFloors])

  // Unit statistics
  const unitStats = useMemo(() => {
    const total = units.length
    const available = units.filter(u => u.isAvailable).length
    const synced = units.filter(u => u.syncWithTemplate).length
    return { total, available, synced }
  }, [units])

  // Handle image upload for a unit type
  const handleImageUpload = async (type: string, file: File) => {
    setUploadingImage(type)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      if (data.url) {
        updateUnitTypeDetail(type, { imageUrl: data.url })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(null)
    }
  }

  // Remove image from a unit type
  const removeUnitTypeImage = (type: string) => {
    updateUnitTypeDetail(type, { imageUrl: undefined })
  }

  const currentFloor = floors.find(f => f.floorNumber === selectedFloor)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="w-5 h-5 text-primary" />
          Units Per Floor Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Configure units per floor and add descriptions for each unit type. Each unit type becomes a separate listing.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Statistics */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalUnits}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{Object.keys(stats.typeStats).length}</p>
            <p className="text-xs text-muted-foreground">Unit Types (Listings)</p>
          </div>
        </div>

        {/* Unit Type Distribution */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">Unit Type Distribution</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.typeStats).map(([type, count]) => {
              const typeInfo = getUnitTypeInfo(type, buildingType)
              return (
                <Badge key={type} variant="outline" className={`${typeInfo.lightColor} ${typeInfo.textColor} border-0`}>
                  <div className={`w-2 h-2 rounded-full ${typeInfo.color} mr-1.5`} />
                  {typeInfo.label}: {count}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Tabs for Floor Config, Unit Type Details, and Individual Units */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="floors" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Floors
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Unit Types
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Units ({unitStats.total})
            </TabsTrigger>
          </TabsList>

          {/* Floor Configuration Tab */}
          <TabsContent value="floors" className="space-y-4 mt-4">
            {/* Floor Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase">Select Floor to Configure</Label>
          <div className="flex items-center gap-2 justify-center">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedFloor(Math.max(1, selectedFloor - 1))} 
              disabled={selectedFloor <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-4 min-w-[120px] text-center">
              Floor {selectedFloor} of {totalFloors}
            </span>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedFloor(Math.min(totalFloors, selectedFloor + 1))} 
              disabled={selectedFloor >= totalFloors}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Visual Building Preview */}
        <TooltipProvider>
          <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg p-3 max-h-[200px] overflow-y-auto">
            <div className="space-y-1">
              {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(floorNum => {
                const floor = floors.find(f => f.floorNumber === floorNum)
                const isSelected = floorNum === selectedFloor
                const totalUnitsOnFloor = floor?.unitTypes.reduce((sum, ut) => sum + ut.count, 0) || 0
                
                return (
                  <button
                    key={floorNum}
                    type="button"
                    onClick={() => setSelectedFloor(floorNum)}
                    className={`w-full flex items-center gap-2 p-2 rounded transition-all ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-8 text-xs font-medium">{floorNum === 1 ? 'G' : `F${floorNum}`}</span>
                    <div className="flex-1 flex gap-1 flex-wrap">
                      {floor?.unitTypes.map((ut, idx) => {
                        const typeInfo = getUnitTypeInfo(ut.type, buildingType)
                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isSelected ? 'bg-white/20 text-white' : `${typeInfo.lightColor} ${typeInfo.textColor}`
                              }`}>
                                {ut.count}× {ut.type}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {ut.count} {typeInfo.label} unit{ut.count !== 1 ? 's' : ''}
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                    <span className="text-xs opacity-70 min-w-[30px] text-right">{totalUnitsOnFloor}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Floor Configuration Editor */}
        {currentFloor && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Configure Floor {selectedFloor}</h4>
              <div className="flex items-center gap-2">
                <Select value={copyFromFloor?.toString() || ''} onValueChange={(val) => {
                  const fromFloor = parseInt(val)
                  if (fromFloor && fromFloor !== selectedFloor) {
                    copyFloorConfig(fromFloor, selectedFloor)
                    setCopyFromFloor(null)
                  }
                }}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Copy from..." />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.filter(f => f.floorNumber !== selectedFloor).map(floor => (
                      <SelectItem key={floor.floorNumber} value={floor.floorNumber.toString()}>
                        Floor {floor.floorNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyToAllFloors(selectedFloor)}
                >
                  Apply to All
                </Button>
              </div>
            </div>

            {/* Unit Types on This Floor */}
            <div className="space-y-2">
              {currentFloor.unitTypes.map((unitType, idx) => {
                const typeInfo = getUnitTypeInfo(unitType.type, buildingType)
                return (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Select 
                        value={unitType.type} 
                        onValueChange={(type) => changeUnitType(selectedFloor, idx, type)}
                      >
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          { unitTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateUnitTypeCount(selectedFloor, idx, unitType.count - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={isNaN(unitType.count) ? 1 : (unitType.count ?? 1)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateUnitTypeCount(selectedFloor, idx, isNaN(val) ? 1 : val);
                          }}
                          className="w-16 h-9 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateUnitTypeCount(selectedFloor, idx, unitType.count + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <span className="flex-1 text-sm text-muted-foreground">
                        {unitType.count} unit{unitType.count !== 1 ? 's' : ''}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeUnitType(selectedFloor, idx)}
                        disabled={currentFloor.unitTypes.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    {/* Fee Input (Monthly for apartments/offices, Per Semester for hostels) */}
                    <div className="flex items-center gap-2 pl-2">
                      <Label htmlFor={`monthly-fee-${idx}`} className="text-xs text-muted-foreground min-w-[100px]">
                        {buildingType === 'hostel' ? 'Per Semester (UGX):' : 'Monthly Fee (UGX):'}
                      </Label>
                      <Input
                        id={`monthly-fee-${idx}`}
                        type="number"
                        min="0"
                        step="any"
                        value={isNaN(unitType.monthlyFee) ? 0 : (unitType.monthlyFee ?? 0)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateUnitTypeMonthlyFee(selectedFloor, idx, isNaN(val) ? 0 : val);
                        }}
                        className="flex-1 h-9"
                        placeholder="e.g., 1000000"
                      />
                      <span className="text-xs text-muted-foreground min-w-[80px]">
                        {new Intl.NumberFormat('en-US').format(unitType.monthlyFee || 0)} UGX
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <span className="text-green-600">✓</span> Synced
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Unit Type Button */}
            <Select onValueChange={(type) => addUnitType(selectedFloor, type)}>
              <SelectTrigger className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Add Unit Type" />
              </SelectTrigger>
              <SelectContent>
                { unitTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
          </TabsContent>

          {/* Unit Type Details Tab - Each unit type is a full property listing */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {uniqueUnitTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No unit types configured yet.</p>
                <p className="text-sm">Add unit types in the Floor Configuration tab first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-primary" />
                    Configure Each Unit Type as a Property Listing
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Each unit type becomes its own <strong>individual property listing</strong>. Add photos, pricing, 
                    description, features, and amenities for each. Click on a unit type to expand and configure all details.
                  </p>
                </div>

                {/* Unit Type Property Forms */}
                {uniqueUnitTypes.map(type => {
                  const typeInfo = getUnitTypeInfo(type, buildingType)
                  const details = getUnitTypeDetail(type)
                  const unitCount = stats.typeStats[type] || 0
                  
                  return (
                    <UnitTypePropertyForm
                      key={type}
                      unitType={type}
                      unitTypeLabel={typeInfo.label}
                      unitTypeColor={typeInfo.color}
                      unitTypeBorderColor={typeInfo.borderColor}
                      unitCount={unitCount}
                      details={details}
                      buildingName={buildingName || 'Building'}
                      buildingLocation={buildingLocation || 'Location'}
                      defaultBedrooms={getDefaultBedrooms(type)}
                      defaultBathrooms={getDefaultBathrooms(type)}
                      onDetailsChange={(updates) => updateUnitTypeDetail(type, updates)}
                      onPriceChangeAcrossAllFloors={updateUnitTypeMonthlyFeeAcrossAllFloors}
                      buildingType={buildingType}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Individual Units Tab */}
          <TabsContent value="units" className="space-y-4 mt-4">
              {/* Unit Stats */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{unitStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Units</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{unitStats.available}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{unitStats.synced}</p>
                  <p className="text-xs text-muted-foreground">Synced</p>
                </div>
              </div>

              {/* Floor Navigator */}
              <div className="flex items-center gap-2 justify-center">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedFloor(Math.max(1, selectedFloor - 1))} 
                  disabled={selectedFloor <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-4">Floor {selectedFloor} of {totalFloors}</span>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedFloor(Math.min(totalFloors, selectedFloor + 1))} 
                  disabled={selectedFloor >= totalFloors}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Add Units */}
              <div className="flex flex-wrap items-end gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="grid gap-1">
                  <Label className="text-xs">Count</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={isNaN(bulkAddCount) ? 1 : (bulkAddCount ?? 1)} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setBulkAddCount(isNaN(val) ? 1 : val);
                    }} 
                    className="w-16 h-8 text-sm" 
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Unit Type</Label>
                  <Select onValueChange={(type) => bulkAddUnits(selectedFloor, bulkAddCount, type)}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                      <SelectValue placeholder="Select & Add" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueUnitTypes.length > 0 ? uniqueUnitTypes.map(type => {
                        const typeInfo = getUnitTypeInfo(type, buildingType)
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                              {typeInfo.label}
                            </div>
                          </SelectItem>
                        )
                      }) : unitTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Select type to add units to Floor {selectedFloor}</p>
              </div>

              {/* Visual Building Preview */}
              <TooltipProvider>
                <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <div className="space-y-1">
                    {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(floorNum => {
                      const floorUnits = unitsByFloor[floorNum] || []
                      const isSelected = floorNum === selectedFloor
                      
                      return (
                        <button
                          key={floorNum}
                          type="button"
                          onClick={() => setSelectedFloor(floorNum)}
                          className={`w-full flex items-center gap-2 p-2 rounded transition-all ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <span className="w-8 text-xs font-medium">{floorNum === 1 ? 'G' : `F${floorNum}`}</span>
                          <div className="flex-1 flex gap-1 overflow-x-auto">
                            {floorUnits.map(unit => {
                              const typeInfo = getUnitTypeInfo(unit.unitType, buildingType)
                              return (
                                <Tooltip key={unit.id}>
                                  <TooltipTrigger asChild>
                                    <div className={`w-6 h-6 rounded text-[8px] font-medium flex items-center justify-center ${
                                      isSelected ? 'bg-white/20 text-white' : `${typeInfo.lightColor} ${typeInfo.textColor}`
                                    } ${!unit.isAvailable ? 'opacity-50 line-through' : ''}`}>
                                      {unit.unitNumber.slice(-2)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    Unit {unit.unitNumber} - {typeInfo.label}
                                    <br />{unit.isAvailable ? 'Available' : 'Taken'}
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}
                          </div>
                          <span className="text-xs opacity-70">{floorUnits.length}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </TooltipProvider>

              {/* Selected Floor Units List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Floor {selectedFloor} Units ({unitsByFloor[selectedFloor]?.length || 0})</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(unitsByFloor[selectedFloor] || []).map(unit => {
                    const typeInfo = getUnitTypeInfo(unit.unitType, buildingType)
                    
                    return (
                      <div key={unit.id} className={`flex items-center gap-2 p-2 rounded-lg border ${unit.isAvailable ? 'bg-background' : 'bg-muted/50'}`}>
                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm ${typeInfo.lightColor} ${typeInfo.textColor}`}>
                          {unit.unitNumber}
                        </div>
                        
                        <Select value={unit.unitType} onValueChange={(type) => updateUnit(unit.id, { unitType: type })}>
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unitTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${type.color}`} />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant={unit.isAvailable ? "default" : "secondary"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateUnit(unit.id, { isAvailable: !unit.isAvailable })}
                        >
                          {unit.isAvailable ? <><Check className="h-3 w-3 mr-1" /> Available</> : <><X className="h-3 w-3 mr-1" /> Taken</>}
                        </Button>

                        <Button
                          type="button"
                          variant={unit.syncWithTemplate ? "outline" : "secondary"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateUnit(unit.id, { syncWithTemplate: !unit.syncWithTemplate })}
                          title={unit.syncWithTemplate ? "This unit syncs with template" : "This unit has individual settings"}
                        >
                          {unit.syncWithTemplate ? "🔗 Synced" : "⚡ Individual"}
                        </Button>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => removeUnit(unit.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => addUnit(selectedFloor, uniqueUnitTypes[0] || '1BR')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Unit to Floor {selectedFloor}
                </Button>
              </div>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

