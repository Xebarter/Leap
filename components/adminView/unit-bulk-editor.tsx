'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface UnitTemplate {
  block_id: string
  template_name: string
  unit_type: string
  bedrooms: number
  bathrooms: number
  price_ugx: number | null
  area_sqft: number | null
  total_units: number
  available_units: number
  synced_units: number
  unit_numbers: string[]
}

interface IndividualUnit {
  id: string
  block_id: string
  property_id: string
  unit_number: string
  floor_number: number
  unit_type: string
  bedrooms: number
  bathrooms: number
  price_ugx: number | null
  area_sqft: number | null
  is_available: boolean
  template_name: string | null
  block_name: string
  block_location: string
}

interface UnitBulkEditorProps {
  blockId?: string
  onUpdate?: () => void
}

export function UnitBulkEditor({ blockId, onUpdate }: UnitBulkEditorProps) {
  const [templates, setTemplates] = useState<UnitTemplate[]>([])
  const [individualUnits, setIndividualUnits] = useState<IndividualUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeView, setActiveView] = useState<'templates' | 'individual'>('templates')

  // Load unit templates and individual units
  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const supabase = createClient()
      
      // Load templates
      let templateQuery = supabase
        .from('unit_templates_summary')
        .select('*')
        .order('template_name')

      if (blockId) {
        templateQuery = templateQuery.eq('block_id', blockId)
      }

      const { data: templatesData, error: templatesError } = await templateQuery
      if (templatesError) throw templatesError
      setTemplates(templatesData || [])
      
      // Load individual units
      let individualQuery = supabase
        .from('individual_units_summary')
        .select('*')
        .order('floor_number', { ascending: true })
        .order('unit_number', { ascending: true })

      if (blockId) {
        individualQuery = individualQuery.eq('block_id', blockId)
      }

      const { data: individualData, error: individualError } = await individualQuery
      if (individualError) throw individualError
      setIndividualUnits(individualData || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Failed to load unit data' })
    } finally {
      setLoading(false)
    }
  }

  // Update all units with a specific template
  const updateTemplate = async (template: UnitTemplate, updates: {
    bedrooms?: number
    bathrooms?: number
    price_ugx?: number
    area_sqft?: number
    unit_type?: string
  }) => {
    setUpdating(template.template_name)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Update one unit with the template name - trigger will sync others
      const { data: sampleUnit } = await supabase
        .from('property_units')
        .select('id')
        .eq('block_id', template.block_id)
        .eq('template_name', template.template_name)
        .limit(1)
        .single()

      if (!sampleUnit) {
        throw new Error('No units found with this template')
      }

      const { error } = await supabase
        .from('property_units')
        .update(updates)
        .eq('id', sampleUnit.id)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `Successfully updated ${template.synced_units} synced unit(s) of type "${template.template_name}"` 
      })
      
      // Reload data to show updated values
      await loadData()
      
      // Call parent update callback
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating template:', error)
      setMessage({ type: 'error', text: 'Failed to update units' })
    } finally {
      setUpdating(null)
    }
  }

  // Load data on mount
  React.useEffect(() => {
    loadData()
  }, [blockId])
  
  // Update individual unit
  const updateIndividualUnit = async (unitId: string, updates: {
    bedrooms?: number
    bathrooms?: number
    price_ugx?: number
    area_sqft?: number
    unit_type?: string
  }) => {
    setUpdating(unitId)
    setMessage(null)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('property_units')
        .update(updates)
        .eq('id', unitId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Successfully updated individual unit' 
      })
      
      await loadData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating unit:', error)
      setMessage({ type: 'error', text: 'Failed to update unit' })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Unit Editor</CardTitle>
          <CardDescription>
            Manage template-based and individual units
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveView('templates')}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                activeView === 'templates' 
                  ? 'bg-background shadow-sm' 
                  : 'hover:bg-background/50'
              }`}
            >
              🔗 Template Units ({templates.length})
            </button>
            <button
              onClick={() => setActiveView('individual')}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                activeView === 'individual' 
                  ? 'bg-background shadow-sm' 
                  : 'hover:bg-background/50'
              }`}
            >
              ⚡ Individual Units ({individualUnits.length})
            </button>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activeView === 'templates' ? (
            templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unit templates found. Create synced units to see them here.
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <TemplateEditor
                    key={`${template.block_id}-${template.template_name}`}
                    template={template}
                    onUpdate={updateTemplate}
                    isUpdating={updating === template.template_name}
                  />
                ))}
              </div>
            )
          ) : (
            individualUnits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No individual units found. Toggle units to "Individual" mode to see them here.
              </div>
            ) : (
              <div className="space-y-4">
                {individualUnits.map((unit) => (
                  <IndividualUnitEditor
                    key={unit.id}
                    unit={unit}
                    onUpdate={updateIndividualUnit}
                    isUpdating={updating === unit.id}
                  />
                ))}
              </div>
            )
          )}

          <Button onClick={loadData} variant="outline" className="w-full">
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual template editor component
function TemplateEditor({
  template,
  onUpdate,
  isUpdating
}: {
  template: UnitTemplate
  onUpdate: (template: UnitTemplate, updates: any) => Promise<void>
  isUpdating: boolean
}) {
  const [bedrooms, setBedrooms] = useState(template.bedrooms)
  const [bathrooms, setBathrooms] = useState(template.bathrooms)
  const [price, setPrice] = useState(template.price_ugx ? template.price_ugx / 100 : 0)
  const [area, setArea] = useState(template.area_sqft || 0)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  React.useEffect(() => {
    const changed = 
      bedrooms !== template.bedrooms ||
      bathrooms !== template.bathrooms ||
      (price * 100) !== (template.price_ugx || 0) ||
      area !== (template.area_sqft || 0)
    setHasChanges(changed)
  }, [bedrooms, bathrooms, price, area, template])

  const handleUpdate = async () => {
    const updates: any = {}
    if (bedrooms !== template.bedrooms) updates.bedrooms = bedrooms
    if (bathrooms !== template.bathrooms) updates.bathrooms = bathrooms
    if ((price * 100) !== (template.price_ugx || 0)) updates.price_ugx = Math.round(price * 100)
    if (area !== (template.area_sqft || 0)) updates.area_sqft = area

    if (Object.keys(updates).length > 0) {
      await onUpdate(template, updates)
      setHasChanges(false)
    }
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{template.template_name}</h4>
            <p className="text-sm text-muted-foreground">
              {template.synced_units} synced • {template.total_units} total • {template.available_units} available
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{template.unit_type}</Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Units: {template.unit_numbers.join(', ')}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`bed-${template.template_name}`} className="text-xs">
              Bedrooms
            </Label>
            <Input
              id={`bed-${template.template_name}`}
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`bath-${template.template_name}`} className="text-xs">
              Bathrooms
            </Label>
            <Input
              id={`bath-${template.template_name}`}
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`price-${template.template_name}`} className="text-xs">
              Price (UGX)
            </Label>
            <Input
              id={`price-${template.template_name}`}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`area-${template.template_name}`} className="text-xs">
              Area (sqft)
            </Label>
            <Input
              id={`area-${template.template_name}`}
              type="number"
              min="0"
              value={area}
              onChange={(e) => setArea(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>
        </div>

        {hasChanges && (
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Updating {template.synced_units} synced units...
              </>
            ) : (
              `Update All ${template.synced_units} Synced Units`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Individual unit editor component
function IndividualUnitEditor({
  unit,
  onUpdate,
  isUpdating
}: {
  unit: IndividualUnit
  onUpdate: (unitId: string, updates: any) => Promise<void>
  isUpdating: boolean
}) {
  const [bedrooms, setBedrooms] = useState(unit.bedrooms)
  const [bathrooms, setBathrooms] = useState(unit.bathrooms)
  const [price, setPrice] = useState(unit.price_ugx ? unit.price_ugx / 100 : 0)
  const [area, setArea] = useState(unit.area_sqft || 0)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  React.useEffect(() => {
    const changed = 
      bedrooms !== unit.bedrooms ||
      bathrooms !== unit.bathrooms ||
      (price * 100) !== (unit.price_ugx || 0) ||
      area !== (unit.area_sqft || 0)
    setHasChanges(changed)
  }, [bedrooms, bathrooms, price, area, unit])

  const handleUpdate = async () => {
    const updates: any = {}
    if (bedrooms !== unit.bedrooms) updates.bedrooms = bedrooms
    if (bathrooms !== unit.bathrooms) updates.bathrooms = bathrooms
    if ((price * 100) !== (unit.price_ugx || 0)) updates.price_ugx = Math.round(price * 100)
    if (area !== (unit.area_sqft || 0)) updates.area_sqft = area

    if (Object.keys(updates).length > 0) {
      await onUpdate(unit.id, updates)
      setHasChanges(false)
    }
  }

  return (
    <Card className="bg-amber-50/50 border-amber-200">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              ⚡ Unit {unit.unit_number}
              <Badge variant="outline" className="text-xs">Floor {unit.floor_number}</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Individual pricing • {unit.is_available ? 'Available' : 'Occupied'}
            </p>
          </div>
          <Badge variant="secondary">{unit.unit_type}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`bed-${unit.id}`} className="text-xs">
              Bedrooms
            </Label>
            <Input
              id={`bed-${unit.id}`}
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`bath-${unit.id}`} className="text-xs">
              Bathrooms
            </Label>
            <Input
              id={`bath-${unit.id}`}
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`price-${unit.id}`} className="text-xs">
              Price (UGX)
            </Label>
            <Input
              id={`price-${unit.id}`}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`area-${unit.id}`} className="text-xs">
              Area (sqft)
            </Label>
            <Input
              id={`area-${unit.id}`}
              type="number"
              min="0"
              value={area}
              onChange={(e) => setArea(parseInt(e.target.value) || 0)}
              className="h-8"
            />
          </div>
        </div>

        {hasChanges && (
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              `Update This Unit Only`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
