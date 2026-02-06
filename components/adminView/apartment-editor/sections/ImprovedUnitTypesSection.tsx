'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, AlertCircle } from 'lucide-react'
import { ApartmentFormData, ApartmentValidationErrors, getUniqueUnitTypes } from '../types'
import { UnitTypeDetails, getUnitTypesForBuilding, FloorConfig } from '../../floor-unit-type-configurator'
import { UnitTypePropertyForm } from '../../unit-type-property-form'

interface ImprovedUnitTypesSectionProps {
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onUpdateUnitTypeDetails: (unitTypeDetails: UnitTypeDetails[]) => void
  onUpdateFloorConfig: (floorConfig: FloorConfig[]) => void
  buildingType?: string
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

export function ImprovedUnitTypesSection({
  formData,
  errors,
  onUpdateUnitTypeDetails,
  onUpdateFloorConfig,
  buildingType = 'apartment'
}: ImprovedUnitTypesSectionProps) {
  // Get unique unit types from floor config
  const uniqueUnitTypes = useMemo(() => getUniqueUnitTypes(formData.floorConfig), [formData.floorConfig])
  
  // Get unit types for building
  const unitTypes = useMemo(() => getUnitTypesForBuilding(buildingType), [buildingType])
  
  // Calculate unit count per type
  const unitTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    formData.floorConfig.forEach(floor => {
      floor.unitTypes.forEach(ut => {
        counts[ut.type] = (counts[ut.type] || 0) + ut.count
      })
    })
    return counts
  }, [formData.floorConfig])
  
  // Get unit type info
  const getUnitTypeInfo = (type: string) => {
    return unitTypes.find(t => t.value === type) || unitTypes[0]
  }
  
  // Get or create details for a unit type
  const getUnitTypeDetail = (type: string): UnitTypeDetails => {
    const existing = formData.unitTypeDetails.find(d => d.type === type)
    const defaults: UnitTypeDetails = {
      type,
      description: '',
      title: '',
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
    
    // Add default specs based on building type
    if (buildingType === 'office') {
      defaults.squareFootage = 100
      defaults.deskCapacity = 1
      defaults.parkingSpaces = 0
      defaults.meetingRooms = 0
      defaults.has24x7Access = false
      defaults.hasServerRoom = false
      defaults.hasReception = false
      defaults.hasKitchenette = false
    } else {
      defaults.area = getDefaultArea(type)
      defaults.bedrooms = getDefaultBedrooms(type)
      defaults.bathrooms = getDefaultBathrooms(type)
    }
    
    if (existing) {
      return { ...defaults, ...existing }
    }
    return defaults
  }
  
  // Update unit type details
  const updateUnitTypeDetail = (type: string, updates: Partial<UnitTypeDetails>) => {
    const existingIndex = formData.unitTypeDetails.findIndex(d => d.type === type)
    
    const defaults: UnitTypeDetails = {
      type,
      description: '',
      title: '',
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
    
    if (buildingType === 'office') {
      defaults.squareFootage = 100
      defaults.deskCapacity = 1
      defaults.parkingSpaces = 0
      defaults.meetingRooms = 0
      defaults.has24x7Access = false
      defaults.hasServerRoom = false
      defaults.hasReception = false
      defaults.hasKitchenette = false
    } else {
      defaults.area = getDefaultArea(type)
      defaults.bedrooms = getDefaultBedrooms(type)
      defaults.bathrooms = getDefaultBathrooms(type)
    }
    
    let newUnitTypeDetails: UnitTypeDetails[]
    if (existingIndex >= 0) {
      newUnitTypeDetails = [...formData.unitTypeDetails]
      newUnitTypeDetails[existingIndex] = { ...newUnitTypeDetails[existingIndex], ...updates }
    } else {
      newUnitTypeDetails = [...formData.unitTypeDetails, { ...defaults, ...updates }]
    }
    
    onUpdateUnitTypeDetails(newUnitTypeDetails)
  }
  
  // Update pricing across all floors when price changes
  const updatePricingAcrossAllFloors = useCallback((type: string, priceUgx: number) => {
    if (priceUgx < 0) return
    
    // Update floor config with new pricing
    const updatedFloorConfig = formData.floorConfig.map(floor => ({
      ...floor,
      unitTypes: floor.unitTypes.map(ut =>
        ut.type === type ? { ...ut, monthlyFee: priceUgx } : ut
      )
    }))
    
    onUpdateFloorConfig(updatedFloorConfig)
    
    // Also update unit type details
    updateUnitTypeDetail(type, { priceUgx })
  }, [formData.floorConfig])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Unit Types & Property Details</h2>
        <p className="text-muted-foreground mt-1">
          Configure pricing, specifications, images, and features for each unit type. Each unit type becomes a separate property listing.
        </p>
      </div>

      {/* Validation Error */}
      {errors.unitTypeDetails && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{errors.unitTypeDetails}</p>
        </div>
      )}

      {uniqueUnitTypes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No unit types configured yet.</p>
            <p className="text-sm text-muted-foreground">
              Go back to the <strong>Floors & Units</strong> section to add unit types first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Home className="h-4 w-4 text-primary" />
              Configure Each Unit Type as a Property Listing
            </h4>
            <p className="text-sm text-muted-foreground">
              Each unit type becomes its own <strong>individual property listing</strong>. Add pricing, photos, 
              description, features, and amenities for each. The pricing you set here will be synced across all floors.
            </p>
          </div>

          {/* Unit Type Property Forms */}
          {uniqueUnitTypes.map(type => {
            const typeInfo = getUnitTypeInfo(type)
            const details = getUnitTypeDetail(type)
            const unitCount = unitTypeCounts[type] || 0
            
            return (
              <UnitTypePropertyForm
                key={type}
                unitType={type}
                unitTypeLabel={typeInfo.label}
                unitTypeColor={typeInfo.color}
                unitTypeBorderColor={typeInfo.borderColor}
                unitCount={unitCount}
                details={details}
                buildingName={formData.buildingName || 'Building'}
                buildingLocation={formData.location || 'Location'}
                defaultBedrooms={getDefaultBedrooms(type)}
                defaultBathrooms={getDefaultBathrooms(type)}
                onDetailsChange={(updates) => updateUnitTypeDetail(type, updates)}
                onPriceChangeAcrossAllFloors={updatePricingAcrossAllFloors}
                buildingType={buildingType}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
