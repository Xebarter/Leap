'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers, Building2, Home } from 'lucide-react'
import { ApartmentFormData, ApartmentValidationErrors, UNIT_TYPE_COLORS, getUnitTypeLabel, calculateBuildingSummary } from '../types'
import { FloorUnitTypeConfigurator, FloorUnitTypeConfiguration, FloorConfig, UnitTypeDetails } from '../../floor-unit-type-configurator'
import { formatPrice } from '@/lib/utils'

interface FloorsConfigSectionProps {
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onUpdateFloorConfig: (floorConfig: FloorConfig[]) => void
  onUpdateUnitTypeDetails: (unitTypeDetails: UnitTypeDetails[]) => void
  buildingName?: string
  buildingLocation?: string
  blockId?: string
}

export function FloorsConfigSection({ 
  formData, 
  errors, 
  onUpdateFloorConfig,
  onUpdateUnitTypeDetails,
  buildingName,
  buildingLocation,
  blockId
}: FloorsConfigSectionProps) {
  const summary = calculateBuildingSummary(formData)
  
  // Handle changes from the floor configurator - sync both floors and unit type details
  const handleConfigChange = useCallback((config: FloorUnitTypeConfiguration) => {
    onUpdateFloorConfig(config.floors)
    
    // Also sync unit type details if they were updated in the configurator
    if (config.unitTypeDetails && config.unitTypeDetails.length > 0) {
      onUpdateUnitTypeDetails(config.unitTypeDetails)
    }
  }, [onUpdateFloorConfig, onUpdateUnitTypeDetails])

  // Build initial config for the configurator
  const initialConfig: FloorUnitTypeConfiguration = {
    totalFloors: formData.totalFloors,
    floors: formData.floorConfig,
    unitTypeDetails: formData.unitTypeDetails
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Floors & Unit Types</h2>
        <p className="text-muted-foreground mt-1">
          Configure the unit types available on each floor of your building
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Floors</p>
                <p className="text-2xl font-bold">{summary.totalFloors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Home className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{summary.totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Types</p>
                <p className="text-2xl font-bold">{summary.unitTypeBreakdown.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Type Breakdown */}
      {summary.unitTypeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unit Type Summary</CardTitle>
            <CardDescription>
              Overview of all unit types across the building
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {summary.unitTypeBreakdown.map((item) => {
                const colors = UNIT_TYPE_COLORS[item.type] || UNIT_TYPE_COLORS['1BR']
                return (
                  <div 
                    key={item.type}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors.border} ${colors.bg}`}
                  >
                    <div className={`font-medium ${colors.text}`}>
                      {item.label}
                    </div>
                    <Badge variant="secondary" className="bg-white">
                      {item.count} unit{item.count !== 1 ? 's' : ''}
                    </Badge>
                    {item.priceRange.max > 0 && (
                      <span className={`text-sm ${colors.text}`}>
                        {item.priceRange.min === item.priceRange.max 
                          ? formatPrice(item.priceRange.min)
                          : `${formatPrice(item.priceRange.min)} - ${formatPrice(item.priceRange.max)}`
                        }
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Error */}
      {errors.floorConfig && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
          <p className="text-sm text-destructive">{errors.floorConfig}</p>
        </div>
      )}

      {/* Floor Configurator */}
      <Card>
        <CardHeader>
          <CardTitle>Floor Configuration</CardTitle>
          <CardDescription>
            Set up the unit types and their distribution across each floor. 
            You can have different unit types on different floors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FloorUnitTypeConfigurator
            totalFloors={formData.totalFloors}
            onChange={handleConfigChange}
            initialConfig={initialConfig}
            buildingName={buildingName || formData.buildingName}
            buildingLocation={buildingLocation || formData.location}
            blockId={blockId || formData.blockId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
