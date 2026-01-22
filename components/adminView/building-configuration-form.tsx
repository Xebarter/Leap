'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, Plus, Minus, Trash2, Home, Check, X, Layers, FileText
} from 'lucide-react'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { generateUnitNumber } from '@/lib/unit-number-generator'

// Unit type options with colors
export const UNIT_TYPES = [
  { value: 'Studio', label: 'Studio', color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-500' },
  { value: '1BR', label: '1 Bedroom', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-500' },
  { value: '2BR', label: '2 Bedroom', color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-500' },
  { value: '3BR', label: '3 Bedroom', color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-500' },
  { value: '4BR', label: '4 Bedroom', color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', borderColor: 'border-rose-500' },
  { value: 'Penthouse', label: 'Penthouse', color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-500' },
]

// Property Template - represents a unique property listing
export interface PropertyTemplate {
  id: string
  name: string
  description: string
  type: string
  bedrooms: number
  bathrooms: number
  area: number
  price: number
  features: string[]
  templateName?: string // Unique identifier for syncing similar units
}

// Unit assigned to a property template
export interface UnitAssignment {
  id: string
  unitNumber: string
  floor: number
  templateId: string
  isAvailable: boolean
  syncWithTemplate?: boolean  // Whether this unit syncs with template (default: true)
}

// Building Configuration
export interface BuildingConfig {
  buildingName: string
  totalFloors: number
  propertyTemplates: PropertyTemplate[]
  units: UnitAssignment[]
}

interface BuildingConfigurationFormProps {
  initialConfig?: BuildingConfig
  onChange: (config: BuildingConfig) => void
  propertyPrice?: number
  propertyBedrooms?: number
  propertyBathrooms?: number
  blockId?: string // Optional block ID for generating proper unit numbers
}

function getUnitTypeInfo(type: string) {
  return UNIT_TYPES.find(t => t.value === type) || UNIT_TYPES[1]
}

// Helper function to generate unique IDs (purely deterministic to avoid hydration issues)
let idCounter = 0;
function generateId() {
  // Use only a counter - fully deterministic, no server/client branch
  idCounter++;
  return `id_${idCounter}`
}

function getDefaultBedrooms(type: string): number {
  const map: Record<string, number> = { 'Studio': 0, '1BR': 1, '2BR': 2, '3BR': 3, '4BR': 4, 'Penthouse': 4 }
  return map[type] ?? 1
}

export function BuildingConfigurationForm({
  initialConfig,
  onChange,
  propertyPrice = 1000000,
  propertyBedrooms = 1,
  propertyBathrooms = 1,
  blockId
}: BuildingConfigurationFormProps) {
  
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
  
  const [config, setConfig] = useState<BuildingConfig>(() => {
    if (initialConfig) return initialConfig
    
    const defaultTemplateId = generateId()
    return {
      buildingName: '',
      totalFloors: 1,
      propertyTemplates: [{
        id: defaultTemplateId,
        name: '1 Bedroom',
        description: '',
        type: '1BR',
        bedrooms: propertyBedrooms,
        bathrooms: propertyBathrooms,
        area: 50,
        price: propertyPrice,
        features: []
      }],
      units: [{
        id: generateId(),
        unitNumber: blockId ? generateUnitNumber(blockId, 1, 1) : 'TEMP-1-001',
        floor: 1,
        templateId: defaultTemplateId,
        isAvailable: true,
        syncWithTemplate: true
      }]
    }
  })

  const [activeTab, setActiveTab] = useState<string>('templates')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    config.propertyTemplates[0]?.id || null
  )
  const [selectedFloor, setSelectedFloor] = useState<number>(1)
  const [bulkAddCount, setBulkAddCount] = useState<number>(1)

  // Keep a ref to the onChange callback to avoid dependency issues
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Update parent whenever configuration changes
  useEffect(() => {
    onChangeRef.current(config)
  }, [config])

  // Template management
  const addTemplate = useCallback((type: string = '1BR') => {
    const bedrooms = getDefaultBedrooms(type)
    const typeLabel = UNIT_TYPES.find(t => t.value === type)?.label || type
    const existingNames = config.propertyTemplates.map(t => t.name)
    let name = typeLabel
    let counter = 1
    while (existingNames.includes(name)) {
      counter++
      name = `${typeLabel} ${counter}`
    }

    // Generate a unique template name for syncing similar units
    // Use counter instead of Date.now() to avoid hydration issues
    const templateName = `${type}_${bedrooms}BR_${Math.max(1, Math.ceil(bedrooms / 2))}BA`

    const newTemplate: PropertyTemplate = {
      id: generateId(),
      name,
      description: '',
      type,
      bedrooms,
      bathrooms: Math.max(1, Math.ceil(bedrooms / 2)),
      area: 40 + (bedrooms * 20),
      price: propertyPrice,
      features: [],
      templateName
    }

    setConfig(prev => ({
      ...prev,
      propertyTemplates: [...prev.propertyTemplates, newTemplate]
    }))
    setSelectedTemplateId(newTemplate.id)
  }, [config.propertyTemplates, propertyPrice])

  const updateTemplate = useCallback((templateId: string, updates: Partial<PropertyTemplate>) => {
    setConfig(prev => ({
      ...prev,
      propertyTemplates: prev.propertyTemplates.map(t => 
        t.id === templateId ? { ...t, ...updates } : t
      )
    }))
  }, [])

  const deleteTemplate = useCallback((templateId: string) => {
    if (config.propertyTemplates.length <= 1) return
    
    setConfig(prev => {
      const remainingTemplates = prev.propertyTemplates.filter(t => t.id !== templateId)
      const fallbackTemplateId = remainingTemplates[0]?.id
      
      return {
        ...prev,
        propertyTemplates: remainingTemplates,
        units: prev.units.map(u => 
          u.templateId === templateId ? { ...u, templateId: fallbackTemplateId } : u
        )
      }
    })
    
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(config.propertyTemplates.find(t => t.id !== templateId)?.id || null)
    }
  }, [config.propertyTemplates, selectedTemplateId])

  // Floor management
  const updateTotalFloors = useCallback((newTotal: number) => {
    if (newTotal < 1 || newTotal > 50) return
    
    setConfig(prev => {
      let newUnits = [...prev.units]
      const defaultTemplateId = prev.propertyTemplates[0]?.id
      
      if (newTotal > prev.totalFloors) {
        for (let floor = prev.totalFloors + 1; floor <= newTotal; floor++) {
          newUnits.push({
            id: generateId(),
            unitNumber: generateUnitNumberForUI(floor, 1),
            floor,
            templateId: defaultTemplateId,
            isAvailable: true,
            syncWithTemplate: true
          })
        }
      } else {
        newUnits = newUnits.filter(u => u.floor <= newTotal)
      }
      
      if (selectedFloor > newTotal) setSelectedFloor(newTotal)
      
      return { ...prev, totalFloors: newTotal, units: newUnits }
    })
  }, [selectedFloor])

  // Unit management
  const addUnit = useCallback((floor: number, templateId: string) => {
    setConfig(prev => {
      const floorUnits = prev.units.filter(u => u.floor === floor)
      const unitIndex = floorUnits.length + 1
      const unitNumber = generateUnitNumberForUI(floor, unitIndex)
      
      return {
        ...prev,
        units: [...prev.units, {
          id: generateId(),
          unitNumber,
          floor,
          templateId,
          isAvailable: true,
          syncWithTemplate: true
        }]
      }
    })
  }, [])

  const removeUnit = useCallback((unitId: string) => {
    setConfig(prev => {
      const unit = prev.units.find(u => u.id === unitId)
      if (!unit) return prev
      
      const newUnits = prev.units.filter(u => u.id !== unitId)
      // Renumber units on the same floor
      let floorCounter = 1
      return {
        ...prev,
        units: newUnits.map(u => {
          if (u.floor === unit.floor) {
            return { ...u, unitNumber: generateUnitNumberForUI(u.floor, floorCounter++) }
          }
          return u
        })
      }
    })
  }, [generateUnitNumberForUI])

  const updateUnit = useCallback((unitId: string, updates: Partial<UnitAssignment>) => {
    setConfig(prev => ({
      ...prev,
      units: prev.units.map(u => u.id === unitId ? { ...u, ...updates } : u)
    }))
  }, [])

  const bulkAddUnits = useCallback((floor: number, count: number, templateId: string) => {
    setConfig(prev => {
      const newUnits = [...prev.units]
      const floorUnits = newUnits.filter(u => u.floor === floor)
      
      for (let i = 0; i < count; i++) {
        const unitIndex = floorUnits.length + i + 1
        newUnits.push({
          id: generateId(),
          unitNumber: generateUnitNumberForUI(floor, unitIndex),
          floor,
          templateId,
          isAvailable: true,
          syncWithTemplate: true
        })
      }
      
      return { ...prev, units: newUnits }
    })
  }, [])

  // Computed values
  const totalUnits = config.units.length
  const availableUnits = config.units.filter(u => u.isAvailable).length
  const selectedTemplate = config.propertyTemplates.find(t => t.id === selectedTemplateId)
  
  const templateStats = useMemo(() => {
    return config.propertyTemplates.map(template => ({
      ...template,
      totalUnits: config.units.filter(u => u.templateId === template.id).length,
      availableUnits: config.units.filter(u => u.templateId === template.id && u.isAvailable).length
    }))
  }, [config.propertyTemplates, config.units])

  const unitsByFloor = useMemo(() => {
    const grouped: Record<number, UnitAssignment[]> = {}
    for (let floor = 1; floor <= config.totalFloors; floor++) {
      grouped[floor] = config.units
        .filter(u => u.floor === floor)
        .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
    }
    return grouped
  }, [config.units, config.totalFloors])

  return (
    <div className="space-y-6">
      {/* Building Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-primary" />
            Building Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="buildingName">Building Name</Label>
            <Input
              id="buildingName"
              placeholder="e.g., Kampala Heights"
              value={config.buildingName}
              onChange={(e) => setConfig(prev => ({ ...prev, buildingName: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Number of Floors</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => updateTotalFloors(config.totalFloors - 1)} disabled={config.totalFloors <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input type="number" min="1" max="50" value={config.totalFloors} onChange={(e) => updateTotalFloors(parseInt(e.target.value) || 1)} className="w-20 text-center" />
              <Button type="button" variant="outline" size="icon" onClick={() => updateTotalFloors(config.totalFloors + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{config.totalFloors}</p>
              <p className="text-xs text-muted-foreground">Floors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalUnits}</p>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{availableUnits}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Templates and Units */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Property Types ({config.propertyTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Units ({totalUnits})
          </TabsTrigger>
        </TabsList>

        {/* Property Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Property Types (Each becomes a separate listing)</CardTitle>
                <Select onValueChange={(type) => addTemplate(type)}>
                  <SelectTrigger className="w-[180px]">
                    <Plus className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Add Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map(type => (
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
            </CardHeader>
            <CardContent className="space-y-3">
              {templateStats.map(template => {
                const typeInfo = getUnitTypeInfo(template.type)
                const isSelected = selectedTemplateId === template.id
                
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected ? `${typeInfo.borderColor} ${typeInfo.lightColor}` : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${typeInfo.color}`} />
                        <span className="font-medium">{template.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {template.availableUnits}/{template.totalUnits} available
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id) }}
                        disabled={config.propertyTemplates.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {template.bedrooms} bed • {template.bathrooms} bath • {template.area}m² • {new Intl.NumberFormat('en-US').format(template.price)} UGX
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Selected Template Editor */}
          {selectedTemplate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit: {selectedTemplate.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Property Name</Label>
                    <Input
                      value={selectedTemplate.name}
                      onChange={(e) => updateTemplate(selectedTemplate.id, { name: e.target.value })}
                      placeholder="e.g., 2 Bedroom Deluxe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit Type</Label>
                    <Select value={selectedTemplate.type || '1BR'} onValueChange={(type) => {
                      const bedrooms = getDefaultBedrooms(type)
                      updateTemplate(selectedTemplate.id, { 
                        type, 
                        bedrooms, 
                        bathrooms: Math.max(1, Math.ceil(bedrooms / 2)),
                        area: 40 + (bedrooms * 20)
                      })
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_TYPES.map(type => (
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
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> All units assigned to this property type will share the same details and price. 
                    Changes here will apply to all {templateStats.find(t => t.id === selectedTemplate.id)?.totalUnits || 0} unit(s) of this type.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="grid gap-2">
                    <Label>Bedrooms</Label>
                    <Input type="number" min="0" value={selectedTemplate.bedrooms} onChange={(e) => updateTemplate(selectedTemplate.id, { bedrooms: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bathrooms</Label>
                    <Input type="number" min="0" value={selectedTemplate.bathrooms} onChange={(e) => updateTemplate(selectedTemplate.id, { bathrooms: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Area (m²)</Label>
                    <Input type="number" min="1" value={selectedTemplate.area} onChange={(e) => updateTemplate(selectedTemplate.id, { area: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (UGX)</Label>
                    <Input type="number" min="0" value={selectedTemplate.price} onChange={(e) => updateTemplate(selectedTemplate.id, { price: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={selectedTemplate.description}
                    onChange={(e) => updateTemplate(selectedTemplate.id, { description: e.target.value })}
                    placeholder="Describe this property type..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Assign Units to Property Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Floor Navigator */}
              <div className="flex items-center gap-2 justify-center">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFloor(Math.max(1, selectedFloor - 1))} disabled={selectedFloor <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-4">Floor {selectedFloor} of {config.totalFloors}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFloor(Math.min(config.totalFloors, selectedFloor + 1))} disabled={selectedFloor >= config.totalFloors}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Add */}
              <div className="flex flex-wrap items-end gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="grid gap-1">
                  <Label className="text-xs">Count</Label>
                  <Input type="number" min="1" max="20" value={bulkAddCount ?? 1} onChange={(e) => setBulkAddCount(parseInt(e.target.value) || 1)} className="w-16 h-8 text-sm" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Property Type</Label>
                  <Select defaultValue={config.propertyTemplates[0]?.id} onValueChange={(templateId) => bulkAddUnits(selectedFloor, bulkAddCount, templateId)}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                      <SelectValue placeholder="Select & Add" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.propertyTemplates.map(template => {
                        const typeInfo = getUnitTypeInfo(template.type)
                        return (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                              {template.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Select type to add units</p>
              </div>

              {/* Visual Building */}
              <TooltipProvider>
                <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-lg p-3 max-h-[250px] overflow-y-auto">
                  <div className="space-y-1">
                    {Array.from({ length: config.totalFloors }, (_, i) => config.totalFloors - i).map(floor => {
                      const floorUnits = unitsByFloor[floor] || []
                      const isSelected = floor === selectedFloor
                      
                      return (
                        <button
                          key={floor}
                          type="button"
                          onClick={() => setSelectedFloor(floor)}
                          className={`w-full flex items-center gap-2 p-2 rounded transition-all ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          <span className="w-8 text-xs font-medium">{floor === 1 ? 'G' : `F${floor}`}</span>
                          <div className="flex-1 flex gap-1 overflow-x-auto">
                            {floorUnits.map(unit => {
                              const template = config.propertyTemplates.find(t => t.id === unit.templateId)
                              const typeInfo = getUnitTypeInfo(template?.type || '1BR')
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
                                    Unit {unit.unitNumber} - {template?.name || 'Unknown'}
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
                    const template = config.propertyTemplates.find(t => t.id === unit.templateId)
                    const typeInfo = getUnitTypeInfo(template?.type || '1BR')
                    
                    return (
                      <div key={unit.id} className={`flex items-center gap-2 p-2 rounded-lg border ${unit.isAvailable ? 'bg-background' : 'bg-muted/50'}`}>
                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm ${typeInfo.lightColor} ${typeInfo.textColor}`}>
                          {unit.unitNumber}
                        </div>
                        
                        <Select value={unit.templateId || config.propertyTemplates[0]?.id || ''} onValueChange={(templateId) => updateUnit(unit.id, { templateId })}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.propertyTemplates.map(t => {
                              const tInfo = getUnitTypeInfo(t.type)
                              return (
                                <SelectItem key={t.id} value={t.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${tInfo.color}`} />
                                    {t.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
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
                          variant={unit.syncWithTemplate !== false ? "outline" : "secondary"}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateUnit(unit.id, { syncWithTemplate: !(unit.syncWithTemplate !== false) })}
                          title={unit.syncWithTemplate !== false ? "This unit syncs with template" : "This unit has individual settings"}
                        >
                          {unit.syncWithTemplate !== false ? "🔗 Synced" : "⚡ Individual"}
                        </Button>

                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeUnit(unit.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
                
                <Button type="button" variant="outline" className="w-full" onClick={() => addUnit(selectedFloor, config.propertyTemplates[0]?.id)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Unit to Floor {selectedFloor}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
