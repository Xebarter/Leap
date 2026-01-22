'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Home, DollarSign, Bed, Bath, Ruler, Image as ImageIcon, 
  ChevronDown, ChevronUp, Check, AlertCircle, Info
} from 'lucide-react'
import { ApartmentFormData, UNIT_TYPE_COLORS, getUnitTypeLabel, calculateBuildingSummary } from '../types'
import { UnitTypeDetails } from '../../floor-unit-type-configurator'
import { formatPrice } from '@/lib/utils'

interface UnitTypesSectionProps {
  formData: ApartmentFormData
  uniqueUnitTypes: string[]
  onUpdateUnitTypeDetails: (type: string, details: Partial<UnitTypeDetails>) => void
  buildingName: string
}

// Default bedroom/bathroom counts per unit type
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

export function UnitTypesSection({ 
  formData, 
  uniqueUnitTypes, 
  onUpdateUnitTypeDetails,
  buildingName 
}: UnitTypesSectionProps) {
  const [activeTab, setActiveTab] = useState(uniqueUnitTypes[0] || '')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const summary = calculateBuildingSummary(formData)

  // Get pricing from floor config for a unit type
  const getPriceFromFloorConfig = (type: string): number => {
    for (const floor of formData.floorConfig) {
      const unitType = floor.unitTypes.find(ut => ut.type === type)
      if (unitType && unitType.monthlyFee > 0) {
        return unitType.monthlyFee
      }
    }
    return 0
  }

  // Get details for a specific unit type, syncing price from floor config
  const getUnitTypeDetails = (type: string): UnitTypeDetails => {
    const existing = formData.unitTypeDetails.find(d => d.type === type)
    const floorPrice = getPriceFromFloorConfig(type)
    
    if (existing) {
      // If existing details don't have price but floor config does, use floor config price
      return {
        ...existing,
        priceUgx: existing.priceUgx || floorPrice,
      }
    }
    
    return {
      type,
      description: '',
      bedrooms: getDefaultBedrooms(type),
      bathrooms: getDefaultBathrooms(type),
      area: getDefaultArea(type),
      priceUgx: floorPrice,
    }
  }

  // Check if a unit type has complete details
  const isUnitTypeComplete = (type: string): boolean => {
    const details = getUnitTypeDetails(type)
    return !!(
      details.description && 
      details.description.length > 10 &&
      details.priceUgx && details.priceUgx > 0
    )
  }

  // Get unit count for a type
  const getUnitCount = (type: string): number => {
    const item = summary.unitTypeBreakdown.find(b => b.type === type)
    return item?.count || 0
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (uniqueUnitTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Unit Type Details</h2>
          <p className="text-muted-foreground mt-1">
            Configure details for each unit type in your building
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Unit Types Configured</h3>
              <p className="text-sm">
                Go back to the "Floors & Units" section to add unit types to your building.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Unit Type Details</h2>
        <p className="text-muted-foreground mt-1">
          Configure pricing, descriptions, and images for each unit type. 
          Each unit type will become a separate property listing.
        </p>
      </div>

      {/* Sync Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-800">Synced with Floors & Units</p>
          <p className="text-blue-700 mt-1">
            Pricing set in the "Floors & Units" section is automatically shown here. 
            Unit types and counts are derived from your floor configuration.
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="flex flex-wrap gap-2">
        {uniqueUnitTypes.map(type => {
          const isComplete = isUnitTypeComplete(type)
          const colors = UNIT_TYPE_COLORS[type] || UNIT_TYPE_COLORS['1BR']
          return (
            <Badge 
              key={type}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                activeTab === type ? colors.bg + ' ' + colors.border : ''
              }`}
              onClick={() => setActiveTab(type)}
            >
              {isComplete ? (
                <Check className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
              )}
              {getUnitTypeLabel(type)} ({getUnitCount(type)})
            </Badge>
          )
        })}
      </div>

      {/* Unit Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {uniqueUnitTypes.map(type => {
            const colors = UNIT_TYPE_COLORS[type] || UNIT_TYPE_COLORS['1BR']
            return (
              <TabsTrigger 
                key={type} 
                value={type}
                className="flex items-center gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${colors.bg.replace('100', '500')}`} />
                {getUnitTypeLabel(type)}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {uniqueUnitTypes.map(type => {
          const details = getUnitTypeDetails(type)
          const colors = UNIT_TYPE_COLORS[type] || UNIT_TYPE_COLORS['1BR']
          const unitCount = getUnitCount(type)
          
          return (
            <TabsContent key={type} value={type} className="space-y-4 mt-4">
              {/* Preview Banner */}
              <div className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${colors.text}`}>
                      {buildingName || 'Building'} - {getUnitTypeLabel(type)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      This listing will represent {unitCount} unit{unitCount !== 1 ? 's' : ''} in your building
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {unitCount} unit{unitCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Basic Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Basic Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Custom Title */}
                  <div className="space-y-2">
                    <Label>Custom Title (Optional)</Label>
                    <Input
                      value={details.title || ''}
                      onChange={(e) => onUpdateUnitTypeDetails(type, { title: e.target.value })}
                      placeholder={`${buildingName || 'Building'} - ${getUnitTypeLabel(type)}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use the default title format
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={details.description || ''}
                      onChange={(e) => onUpdateUnitTypeDetails(type, { description: e.target.value })}
                      placeholder={`Describe the ${getUnitTypeLabel(type).toLowerCase()} units in this building...`}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe features, layout, views, and amenities for this unit type
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </CardTitle>
                  <CardDescription>
                    {getPriceFromFloorConfig(type) > 0 && !details.priceUgx && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Check className="h-3 w-3" />
                        Price synced from Floors & Units configuration
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Monthly Rent (UGX) <span className="text-destructive">*</span></Label>
                    <div className="relative max-w-[300px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        UGX
                      </span>
                      <Input
                        type="number"
                        value={details.priceUgx || ''}
                        onChange={(e) => onUpdateUnitTypeDetails(type, { priceUgx: parseInt(e.target.value) || 0 })}
                        placeholder="1,500,000"
                        className="pl-12"
                        min={0}
                      />
                    </div>
                    {details.priceUgx && details.priceUgx > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Formatted: {formatPrice(details.priceUgx)} /month
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Bed className="h-4 w-4" /> Bedrooms
                      </Label>
                      <Input
                        type="number"
                        value={details.bedrooms ?? getDefaultBedrooms(type)}
                        onChange={(e) => onUpdateUnitTypeDetails(type, { bedrooms: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Bath className="h-4 w-4" /> Bathrooms
                      </Label>
                      <Input
                        type="number"
                        value={details.bathrooms ?? getDefaultBathrooms(type)}
                        onChange={(e) => onUpdateUnitTypeDetails(type, { bathrooms: parseInt(e.target.value) || 0 })}
                        min={0}
                        max={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" /> Area (m²)
                      </Label>
                      <Input
                        type="number"
                        value={details.area ?? getDefaultArea(type)}
                        onChange={(e) => onUpdateUnitTypeDetails(type, { area: parseInt(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features (Collapsible) */}
              <Card>
                <CardHeader 
                  className="cursor-pointer" 
                  onClick={() => toggleSection(`features-${type}`)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Features & Amenities</CardTitle>
                    {expandedSections[`features-${type}`] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                  <CardDescription>
                    List the features included in this unit type
                  </CardDescription>
                </CardHeader>
                {expandedSections[`features-${type}`] && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Features (comma-separated)</Label>
                      <Textarea
                        value={details.features?.join(', ') || ''}
                        onChange={(e) => onUpdateUnitTypeDetails(type, { 
                          features: e.target.value.split(',').map(f => f.trim()).filter(Boolean)
                        })}
                        placeholder="Air Conditioning, Balcony, Built-in Wardrobe, Parking Space"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
