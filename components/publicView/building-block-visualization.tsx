'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Home, Users, CheckCircle, XCircle, Hash } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { generateUnitNumber, formatUnitNumber } from '@/lib/unit-number-generator'

export interface Unit {
  id: string
  unitNumber: string
  uniqueId?: string // 10-digit unique identifier
  floor: number
  type: string // e.g., "1BR", "2BR", "Studio", "3BR"
  isAvailable: boolean
  is_occupied?: boolean // Whether the unit is currently occupied (paid for)
  price?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  property_id?: string // ID of the property this unit belongs to
}

export interface FloorUnitConfig {
  totalFloors: number
  floors: Array<{
    floorNumber: number
    unitTypes: Array<{
      type: string
      count: number
    }>
  }>
}

export interface BuildingBlockVisualizationProps {
  buildingName: string
  totalFloors: number
  units: Unit[]
  floorUnitConfig?: FloorUnitConfig | null // Optional floor configuration
  currentPropertyId?: string // ID of the currently displayed property
  onUnitClick?: (unit: Unit) => void // Callback when a unit is clicked
}

// Color palette for different unit types
const unitTypeColors: Record<string, { available: string; taken: string; occupied: string; border: string; text: string }> = {
  'Studio': {
    available: 'bg-emerald-100 hover:bg-emerald-200',
    taken: 'bg-emerald-400/50',
    occupied: 'bg-gray-300',
    border: 'border-emerald-500',
    text: 'text-emerald-700'
  },
  '1BR': {
    available: 'bg-blue-100 hover:bg-blue-200',
    taken: 'bg-blue-400/50',
    occupied: 'bg-gray-300',
    border: 'border-blue-500',
    text: 'text-blue-700'
  },
  '2BR': {
    available: 'bg-purple-100 hover:bg-purple-200',
    taken: 'bg-purple-400/50',
    occupied: 'bg-gray-300',
    border: 'border-purple-500',
    text: 'text-purple-700'
  },
  '3BR': {
    available: 'bg-amber-100 hover:bg-amber-200',
    taken: 'bg-amber-400/50',
    occupied: 'bg-gray-300',
    border: 'border-amber-500',
    text: 'text-amber-700'
  },
  '4BR': {
    available: 'bg-rose-100 hover:bg-rose-200',
    taken: 'bg-rose-400/50',
    occupied: 'bg-gray-300',
    border: 'border-rose-500',
    text: 'text-rose-700'
  },
  'Penthouse': {
    available: 'bg-indigo-100 hover:bg-indigo-200',
    taken: 'bg-indigo-400/50',
    occupied: 'bg-gray-300',
    border: 'border-indigo-500',
    text: 'text-indigo-700'
  },
}

// Default color for unknown types
const defaultColor = {
  available: 'bg-gray-100 hover:bg-gray-200',
  taken: 'bg-gray-400/50',
  occupied: 'bg-gray-300',
  border: 'border-gray-500',
  text: 'text-gray-700'
}

function getUnitColor(type: string) {
  return unitTypeColors[type] || defaultColor
}

export function BuildingBlockVisualization({ 
  buildingName, 
  totalFloors, 
  units,
  floorUnitConfig,
  currentPropertyId,
  onUnitClick
}: BuildingBlockVisualizationProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [hoveredType, setHoveredType] = useState<string | null>(null)

  const handleUnitClick = (unit: Unit) => {
    // Toggle selected unit
    setSelectedUnit(selectedUnit?.id === unit.id ? null : unit)
    
    // Always call onUnitClick if provided (not just for different properties)
    if (onUnitClick) {
      onUnitClick(unit)
    }
  }

  // Group units by floor - generate from config if available, otherwise use actual units
  const unitsByFloor = useMemo(() => {
    const grouped: Record<number, Unit[]> = {}
    
    if (floorUnitConfig) {
      // Generate units based on configuration
      for (const floorConfig of floorUnitConfig.floors) {
        const floorUnits: Unit[] = []
        let unitIndex = 1
        
        for (const unitType of floorConfig.unitTypes) {
          for (let i = 0; i < unitType.count; i++) {
            const unitNumber = `${floorConfig.floorNumber}${String(unitIndex).padStart(2, '0')}`
            const bedrooms = unitType.type === 'Studio' ? 0 : 
                           unitType.type === '1BR' ? 1 :
                           unitType.type === '2BR' ? 2 :
                           unitType.type === '3BR' ? 3 :
                           unitType.type === '4BR' ? 4 :
                           unitType.type === 'Penthouse' ? 4 : 1
            
            // Try to find actual unit data if available
            const actualUnit = units.find(u => u.floor === floorConfig.floorNumber && u.unitNumber === unitNumber)
            
            // Generate unique 10-digit identifier for this unit
            const unitId = actualUnit?.id || `generated-${unitNumber}`
            const uniqueId = actualUnit?.uniqueId || generateUnitNumber(
              currentPropertyId || unitId,
              floorConfig.floorNumber,
              unitIndex
            )
            
            floorUnits.push({
              id: unitId,
              unitNumber,
              uniqueId,
              floor: floorConfig.floorNumber,
              type: unitType.type,
              isAvailable: actualUnit?.isAvailable ?? true,
              price: actualUnit?.price,
              area: actualUnit?.area,
              bedrooms: actualUnit?.bedrooms ?? bedrooms,
              bathrooms: actualUnit?.bathrooms ?? Math.max(1, Math.ceil(bedrooms / 2)),
              property_id: actualUnit?.property_id
            })
            
            unitIndex++
          }
        }
        
        grouped[floorConfig.floorNumber] = floorUnits
      }
    } else {
      // Use actual units - add unique IDs if not present
      for (let floor = totalFloors; floor >= 1; floor--) {
        const floorUnits = units
          .filter(unit => unit.floor === floor)
          .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
        
        // Generate unique IDs for units that don't have them
        grouped[floor] = floorUnits.map((unit, index) => ({
          ...unit,
          uniqueId: unit.uniqueId || generateUnitNumber(
            currentPropertyId || unit.property_id || unit.id,
            floor,
            index + 1
          )
        }))
      }
    }
    
    return grouped
  }, [units, totalFloors, floorUnitConfig, currentPropertyId])

  // Calculate statistics
  const stats = useMemo(() => {
    const typeStats: Record<string, { available: number; taken: number }> = {}
    
    units.forEach(unit => {
      if (!typeStats[unit.type]) {
        typeStats[unit.type] = { available: 0, taken: 0 }
      }
      if (unit.isAvailable) {
        typeStats[unit.type].available++
      } else {
        typeStats[unit.type].taken++
      }
    })

    const totalAvailable = units.filter(u => u.isAvailable).length
    const totalTaken = units.filter(u => !u.isAvailable).length

    return { typeStats, totalAvailable, totalTaken, total: units.length }
  }, [units])

  // Get unique unit types for legend
  const unitTypes = useMemo(() => {
    return [...new Set(units.map(u => u.type))].sort()
  }, [units])

  return (
    <Card className="border-none shadow-none bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5 text-primary" />
          {buildingName} - Unit Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-background rounded-lg p-2">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </div>
          <div className="bg-background rounded-lg p-2">
            <p className="text-2xl font-bold text-green-600">{stats.totalAvailable}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="bg-background rounded-lg p-2">
            <p className="text-2xl font-bold text-red-500">{stats.totalTaken}</p>
            <p className="text-xs text-muted-foreground">Taken</p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit Types</p>
          <div className="flex flex-wrap gap-2">
            {unitTypes.map(type => {
              const colors = getUnitColor(type)
              const typeData = stats.typeStats[type]
              return (
                <button
                  key={type}
                  onMouseEnter={() => setHoveredType(type)}
                  onMouseLeave={() => setHoveredType(null)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all border-2 ${colors.border} ${colors.available} ${hoveredType === type ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                >
                  <span className={colors.text}>{type}</span>
                  <span className="text-muted-foreground">
                    ({typeData.available}/{typeData.available + typeData.taken})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Availability Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-100"></div>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-gray-400 bg-gray-300 opacity-60">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3 h-0.5 bg-gray-500 rotate-45 absolute"></div>
              </div>
            </div>
            <span className="text-muted-foreground">Taken</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border-2 border-gray-500 bg-gray-300 opacity-40 relative">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3 h-0.5 bg-gray-600 rotate-45 absolute"></div>
              </div>
            </div>
            <span className="text-muted-foreground">Occupied (Paid)</span>
          </div>
        </div>

        {/* Building Visualization */}
        <TooltipProvider>
          <div className="relative bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg p-3 overflow-hidden">
            {/* Roof */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-4 bg-slate-500 rounded-t-lg"></div>
            
            {/* Building Floors */}
            <div className="space-y-1 relative z-10">
              {Array.from({ length: totalFloors }, (_, i) => totalFloors - i).map(floor => {
                const floorUnits = unitsByFloor[floor] || []
                const isTopFloor = floor === totalFloors
                const isGroundFloor = floor === 1
                
                return (
                  <div key={floor} className="flex items-center gap-2">
                    {/* Floor Label */}
                    <div className="w-8 text-xs font-medium text-slate-600 text-right shrink-0">
                      {isGroundFloor ? 'G' : `F${floor}`}
                    </div>
                    
                    {/* Floor Units */}
                    <div 
                      className={`flex-1 flex gap-1 p-1.5 bg-slate-100 rounded ${isTopFloor ? 'rounded-t-lg' : ''} ${isGroundFloor ? 'rounded-b-lg' : ''}`}
                    >
                      {floorUnits.length > 0 ? (
                        floorUnits.map(unit => {
                          const colors = getUnitColor(unit.type)
                          const isHighlighted = hoveredType === null || hoveredType === unit.type
                          const isOccupied = unit.is_occupied === true
                          const isClickable = !isOccupied
                          
                          return (
                            <Tooltip key={unit.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => isClickable && handleUnitClick(unit)}
                                  disabled={isOccupied}
                                  className={`
                                    flex-1 min-w-[40px] h-10 rounded-sm border-2 transition-all relative
                                    ${isOccupied ? colors.occupied : (unit.isAvailable ? colors.available : colors.taken)}
                                    ${colors.border}
                                    ${isOccupied ? 'opacity-40 cursor-not-allowed' : (!unit.isAvailable ? 'opacity-50' : 'cursor-pointer')}
                                    ${!isHighlighted ? 'opacity-30' : ''}
                                    ${selectedUnit?.id === unit.id ? 'ring-2 ring-primary ring-offset-1' : ''}
                                  `}
                                >
                                  <span className={`text-[10px] font-medium ${isOccupied ? 'text-gray-500' : colors.text}`}>
                                    {unit.unitNumber}
                                  </span>
                                  {(isOccupied || !unit.isAvailable) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-full h-0.5 bg-slate-500/50 rotate-45"></div>
                                    </div>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="p-2">
                                <div className="text-xs space-y-1">
                                  <p className="font-semibold">Unit {unit.unitNumber}</p>
                                  {unit.uniqueId && (
                                    <p className="flex items-center gap-1 text-muted-foreground font-mono">
                                      <Hash className="w-3 h-3" />
                                      {formatUnitNumber(unit.uniqueId)}
                                    </p>
                                  )}
                                  <p className="text-muted-foreground">{unit.type} • Floor {unit.floor}</p>
                                  {unit.area && <p>{unit.area} m²</p>}
                                  {unit.price && <p className="font-medium text-primary">{new Intl.NumberFormat('en-US').format(unit.price)} UGX/mo</p>}
                                  <Badge variant={isOccupied ? "destructive" : (unit.isAvailable ? "default" : "secondary")} className="text-[10px]">
                                    {isOccupied ? "Occupied" : (unit.isAvailable ? "Available" : "Taken")}
                                  </Badge>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })
                      ) : (
                        <div className="flex-1 h-10 flex items-center justify-center text-xs text-muted-foreground">
                          No units
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Ground/Foundation */}
            <div className="mt-2 h-2 bg-slate-600 rounded-b-sm"></div>
          </div>
        </TooltipProvider>

        {/* Selected Unit Details */}
        {selectedUnit && (
          <div className="bg-background rounded-lg p-3 border border-border animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Unit {selectedUnit.unitNumber}</span>
                  <Badge variant={selectedUnit.isAvailable ? "default" : "secondary"} className="text-xs">
                    {selectedUnit.isAvailable ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Available</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" /> Taken</>
                    )}
                  </Badge>
                </div>
                {selectedUnit.uniqueId && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-mono text-muted-foreground">Unit ID:</span>
                    <span className="font-mono font-semibold text-primary">{formatUnitNumber(selectedUnit.uniqueId)}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {selectedUnit.type} • Floor {selectedUnit.floor}
                  {selectedUnit.area && ` • ${selectedUnit.area} m²`}
                </p>
                {selectedUnit.bedrooms !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {selectedUnit.bedrooms} Bed{selectedUnit.bedrooms !== 1 ? 's' : ''} 
                    {selectedUnit.bathrooms !== undefined && ` • ${selectedUnit.bathrooms} Bath${selectedUnit.bathrooms !== 1 ? 's' : ''}`}
                  </p>
                )}
              </div>
              {selectedUnit.price && (
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{new Intl.NumberFormat('en-US').format(selectedUnit.price)}</p>
                  <p className="text-xs text-muted-foreground">UGX/month</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unit Type Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Availability by Type</p>
          <div className="space-y-1.5">
            {unitTypes.map(type => {
              const colors = getUnitColor(type)
              const typeData = stats.typeStats[type]
              const total = typeData.available + typeData.taken
              const availablePercent = (typeData.available / total) * 100
              
              return (
                <div key={type} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${colors.text}`}>{type}</span>
                    <span className="text-muted-foreground">
                      {typeData.available} available / {total} total
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors.available.replace('hover:bg-', 'bg-').split(' ')[0]} transition-all`}
                      style={{ width: `${availablePercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
