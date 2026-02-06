'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Layers, Building2, Home, Plus, Minus, Copy } from 'lucide-react'
import { ApartmentFormData, ApartmentValidationErrors, UNIT_TYPE_COLORS, getUnitTypeLabel } from '../types'
import { FloorConfig, UnitTypeConfig, getUnitTypesForBuilding } from '../../floor-unit-type-configurator'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

interface SimplifiedFloorsConfigSectionProps {
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onUpdateFloorConfig: (floorConfig: FloorConfig[]) => void
  buildingType?: string // 'apartment', 'hostel', or 'office'
}

export function SimplifiedFloorsConfigSection({ 
  formData, 
  errors, 
  onUpdateFloorConfig,
  buildingType = 'apartment'
}: SimplifiedFloorsConfigSectionProps) {
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  
  // Get the appropriate unit types based on building type
  const unitTypes = useMemo(() => getUnitTypesForBuilding(buildingType), [buildingType])
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const unitTypeBreakdown: Map<string, number> = new Map()
    let totalUnits = 0
    
    formData.floorConfig.forEach(floor => {
      floor.unitTypes.forEach(ut => {
        const existing = unitTypeBreakdown.get(ut.type) || 0
        unitTypeBreakdown.set(ut.type, existing + ut.count)
        totalUnits += ut.count
      })
    })
    
    const breakdown = Array.from(unitTypeBreakdown.entries()).map(([type, count]) => ({
      type,
      label: getUnitTypeLabel(type),
      count
    }))
    
    return {
      totalFloors: formData.totalFloors,
      totalUnits,
      unitTypeBreakdown: breakdown
    }
  }, [formData.floorConfig, formData.totalFloors])
  
  // Add a unit type to a floor
  const addUnitType = useCallback((floorNumber: number, type: string = '1BR') => {
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => {
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
            // Add new type (monthlyFee will be set in Unit Types section)
            return {
              ...floor,
              unitTypes: [...floor.unitTypes, { type, count: 1, monthlyFee: 0 }]
            }
          }
        }
        return floor
      })
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  // Update unit type count
  const updateUnitTypeCount = useCallback((floorNumber: number, typeIndex: number, count: number) => {
    if (count < 0) return
    
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = [...floor.unitTypes]
          if (count === 0) {
            // Remove if count is 0
            newUnitTypes.splice(typeIndex, 1)
            // Ensure at least one unit type remains
            if (newUnitTypes.length === 0) {
              newUnitTypes.push({ type: '1BR', count: 1, monthlyFee: 0 })
            }
          } else {
            newUnitTypes[typeIndex] = { ...newUnitTypes[typeIndex], count }
          }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  // Change unit type
  const changeUnitType = useCallback((floorNumber: number, typeIndex: number, newType: string) => {
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = [...floor.unitTypes]
          newUnitTypes[typeIndex] = { ...newUnitTypes[typeIndex], type: newType }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  // Remove a unit type from a floor
  const removeUnitType = useCallback((floorNumber: number, typeIndex: number) => {
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => {
        if (floor.floorNumber === floorNumber) {
          const newUnitTypes = floor.unitTypes.filter((_, idx) => idx !== typeIndex)
          // Ensure at least one unit type remains
          if (newUnitTypes.length === 0) {
            newUnitTypes.push({ type: '1BR', count: 1, monthlyFee: 0 })
          }
          return { ...floor, unitTypes: newUnitTypes }
        }
        return floor
      })
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  // Copy configuration from one floor to another
  const copyFloorConfig = useCallback((fromFloor: number, toFloor: number) => {
    const sourceFloor = formData.floorConfig.find(f => f.floorNumber === fromFloor)
    if (!sourceFloor) return
    
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => {
        if (floor.floorNumber === toFloor) {
          return {
            ...floor,
            unitTypes: sourceFloor.unitTypes.map(ut => ({ ...ut }))
          }
        }
        return floor
      })
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  // Apply configuration to all floors
  const applyToAllFloors = useCallback((floorNumber: number) => {
    const sourceFloor = formData.floorConfig.find(f => f.floorNumber === floorNumber)
    if (!sourceFloor) return
    
    onUpdateFloorConfig(
      formData.floorConfig.map(floor => ({
        ...floor,
        unitTypes: sourceFloor.unitTypes.map(ut => ({ ...ut }))
      }))
    )
  }, [formData.floorConfig, onUpdateFloorConfig])
  
  const currentFloor = formData.floorConfig.find(f => f.floorNumber === selectedFloor)
  
  const getUnitTypeInfo = (type: string) => {
    return unitTypes.find(t => t.value === type) || unitTypes[0]
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Floors & Units Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Configure how many units of each type are on each floor. Pricing and details will be set in the next step.
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
        <CardContent className="space-y-4">
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
                Floor {selectedFloor} of {formData.totalFloors}
              </span>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedFloor(Math.min(formData.totalFloors, selectedFloor + 1))} 
                disabled={selectedFloor >= formData.totalFloors}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Visual Building Preview */}
          <TooltipProvider>
            <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg p-3 max-h-[200px] overflow-y-auto">
              <div className="space-y-1">
                {Array.from({ length: formData.totalFloors }, (_, i) => formData.totalFloors - i).map(floorNum => {
                  const floor = formData.floorConfig.find(f => f.floorNumber === floorNum)
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
                          const typeInfo = getUnitTypeInfo(ut.type)
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
                  <Select value="" onValueChange={(val) => {
                    const fromFloor = parseInt(val)
                    if (fromFloor && fromFloor !== selectedFloor) {
                      copyFloorConfig(fromFloor, selectedFloor)
                    }
                  }}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Copy from..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.floorConfig.filter(f => f.floorNumber !== selectedFloor).map(floor => (
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
                  const typeInfo = getUnitTypeInfo(unitType.type)
                  return (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <Select 
                        value={unitType.type} 
                        onValueChange={(type) => changeUnitType(selectedFloor, idx, type)}
                      >
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitTypes.map(type => (
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
                          value={unitType.count}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (!isNaN(val)) updateUnitTypeCount(selectedFloor, idx, val)
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
                  {unitTypes.map(type => (
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
        </CardContent>
      </Card>
    </div>
  )
}
