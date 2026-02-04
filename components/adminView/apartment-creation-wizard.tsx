'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, MapPin, Layers, ImageIcon, FileText, 
  ChevronRight, ChevronLeft, Check, Upload, X, Loader2,
  Home, ArrowRight, Sparkles, User
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FloorUnitTypeConfigurator, 
  FloorUnitTypeConfiguration,
  UnitTypeDetails,
  UNIT_TYPES 
} from './floor-unit-type-configurator'

// Wizard Steps
const STEPS = [
  { id: 'building', title: 'Building Info', icon: Building2, description: 'Name and location' },
  { id: 'floors', title: 'Floors & Units', icon: Layers, description: 'Configure structure' },
  { id: 'unit-types', title: 'Unit Types', icon: Home, description: 'Details per type' },
  { id: 'review', title: 'Review', icon: Check, description: 'Confirm and create' },
]

// Initial data for editing mode
export interface ApartmentEditData {
  blockId: string
  blockName?: string
  buildingName: string
  location: string
  totalFloors: number
  minimumInitialMonths: number
  category?: string
  // Reconstructed floor configuration (includes all unit type details)
  floorConfig: FloorUnitTypeConfiguration
  // Property IDs for existing unit type properties (needed for edit mode)
  existingPropertyIds?: string[]
}

interface ApartmentCreationWizardProps {
  onComplete: () => void
  onCancel: () => void
  editData?: ApartmentEditData // Optional edit data for edit mode
}

export function ApartmentCreationWizard({ onComplete, onCancel, editData }: ApartmentCreationWizardProps) {
  // Determine if we're in edit mode
  const isEditMode = !!editData

  // Current step
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load landlords on mount
  React.useEffect(() => {
    loadLandlords();
  }, []);

  const loadLandlords = async () => {
    try {
      const supabase = await import('@/lib/supabase/client').then(m => m.createClient());
      const { data, error } = await supabase
        .from("landlord_profiles")
        .select(`
          id,
          user_id,
          business_name,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("status", "active")
        .order("business_name");

      if (!error && data) {
        setLandlords(data);
      }
    } catch (error) {
      console.error("Error loading landlords:", error);
    }
  };
  
  // Step 1: Building Info (building-level only)
  const [buildingName, setBuildingName] = useState(editData?.buildingName || '')
  const [location, setLocation] = useState(editData?.location || '')
  const [landlords, setLandlords] = useState<any[]>([])
  const [selectedLandlordId, setSelectedLandlordId] = useState<string>('')
  
  // Step 2: Floor Configuration
  const [totalFloors, setTotalFloors] = useState(editData?.totalFloors || 5)
  const [floorConfig, setFloorConfig] = useState<FloorUnitTypeConfiguration | null>(editData?.floorConfig || null)
  
  // Step 3: Unit Type Details (managed within floorConfig.unitTypeDetails)

  // Calculate progress
  const progress = ((currentStep + 1) / STEPS.length) * 100

  // Handle floor config changes
  const handleFloorConfigChange = useCallback((config: FloorUnitTypeConfiguration) => {
    setFloorConfig(config)
  }, [])

  // Get unique unit types from config
  const getUniqueUnitTypes = (): string[] => {
    if (!floorConfig) return []
    const types = new Set<string>()
    floorConfig.floors.forEach(floor => {
      floor.unitTypes.forEach(ut => types.add(ut.type))
    })
    return Array.from(types).sort()
  }

  // Validation for each step
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // Building Info
        return buildingName.trim().length > 0 && location.trim().length > 0
      case 1: // Floors & Units
        return floorConfig !== null && floorConfig.floors.length > 0
      case 2: // Unit Types
        return true // Optional step
      case 3: // Review
        return true
      default:
        return false
    }
  }

  // Navigation
  const goNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step <= currentStep || canProceed()) {
      setCurrentStep(step)
    }
  }

  // Submit handler - calls the API route which has proper permissions
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (isEditMode) {
        await updateApartmentProperties()
      } else {
        await createApartmentProperties()
      }
      onComplete()
    } catch (error) {
      console.error('Error saving apartment:', error)
      alert(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} apartment. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update apartment properties via API route
  const updateApartmentProperties = async () => {
    if (!floorConfig || !editData) {
      throw new Error('Floor configuration and edit data are required')
    }

    console.log('=== Submitting apartment update via API ===')
    console.log('Block ID:', editData.blockId)
    console.log('Building Name:', buildingName)
    console.log('Location:', location)
    console.log('Floor Config:', floorConfig)

    // Prepare the payload for the API
    const payload = {
      title: buildingName,
      building_name: buildingName,
      location: location,
      description: `Apartment building at ${location}`,
      price: 0,
      category: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      total_floors: floorConfig.totalFloors,
      units_config: '',
      floor_unit_config: floorConfig,
      minimum_initial_months: editData.minimumInitialMonths,
      landlord_id: selectedLandlordId || null, // Add landlord_id
      // Edit mode specific fields
      block_id: editData.blockId,
      existing_property_ids: editData.existingPropertyIds || [],
      is_edit_mode: true,
    }

    console.log('API Payload:', payload)

    // Call the API route with PUT method for updates
    const response = await fetch('/api/properties', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('API Error:', result)
      throw new Error(result.error || 'Failed to update apartment properties')
    }

    console.log('=== Apartment update successful! ===')
    console.log('Result:', result)
    
    return result
  }

  // Create apartment properties via API route (which uses service role key and bypasses RLS)
  const createApartmentProperties = async () => {
    if (!floorConfig) {
      throw new Error('Floor configuration is required')
    }

    console.log('=== Submitting apartment creation via API ===')
    console.log('Building Name:', buildingName)
    console.log('Location:', location)
    console.log('Floor Config:', floorConfig)

    // Prepare the payload for the API
    const payload = {
      title: buildingName,
      building_name: buildingName,
      location: location,
      description: `Apartment building at ${location}`,
      price: 0, // Will be set per unit type
      category: 'Apartment',
      bedrooms: 1,
      bathrooms: 1,
      total_floors: floorConfig.totalFloors,
      units_config: '',
      floor_unit_config: floorConfig, // Pass the full floor configuration
      landlord_id: selectedLandlordId || null, // Add landlord_id
    }

    console.log('API Payload:', payload)

    // Call the API route which has proper permissions (service role key)
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('API Error:', result)
      throw new Error(result.error || 'Failed to create apartment properties')
    }

    console.log('=== Apartment creation successful! ===')
    console.log('Result:', result)
    
    return result
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header with Progress */}
      <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {isEditMode ? 'Edit Apartment Building' : 'Create Apartment Building'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isClickable = index <= currentStep || canProceed()
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => goToStep(index)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                        : 'bg-muted text-muted-foreground'
                  } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Step 1: Building Info */}
        {currentStep === 0 && (
          <BuildingInfoStep
            buildingName={buildingName}
            setBuildingName={setBuildingName}
            location={location}
            setLocation={setLocation}
            totalFloors={totalFloors}
            setTotalFloors={setTotalFloors}
            landlords={landlords}
            selectedLandlordId={selectedLandlordId}
            setSelectedLandlordId={setSelectedLandlordId}
          />
        )}

        {/* Step 2: Floor Configuration */}
        {currentStep === 1 && (
          <FloorConfigStep
            totalFloors={totalFloors}
            floorConfig={floorConfig}
            onConfigChange={handleFloorConfigChange}
          />
        )}

        {/* Step 3: Unit Type Details */}
        {currentStep === 2 && (
          <UnitTypeDetailsStep
            floorConfig={floorConfig}
            onConfigChange={handleFloorConfigChange}
            buildingName={buildingName}
          />
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <ReviewStep
            buildingName={buildingName}
            location={location}
            floorConfig={floorConfig}
          />
        )}
      </div>

      {/* Footer with Navigation */}
      <div className="flex-shrink-0 border-t bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onCancel : goBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          <div className="flex items-center gap-2">
            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Apartment
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 1: Building Info Component - Only building-level information
function BuildingInfoStep({
  buildingName, setBuildingName,
  location, setLocation,
  totalFloors, setTotalFloors,
  landlords,
  selectedLandlordId,
  setSelectedLandlordId
}: {
  buildingName: string
  setBuildingName: (v: string) => void
  location: string
  setLocation: (v: string) => void
  totalFloors: number
  setTotalFloors: (v: number) => void
  landlords: any[]
  selectedLandlordId: string
  setSelectedLandlordId: (v: string) => void
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold">Let's start with your building</h3>
        <p className="text-muted-foreground mt-2">
          Enter the basic information about your apartment building.
          <br />
          <span className="text-xs">Property details (images, pricing, features) will be configured per unit type.</span>
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Building Information
          </CardTitle>
          <CardDescription>
            This information applies to the entire building
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="buildingName" className="text-base">
              Building Name *
            </Label>
            <Input
              id="buildingName"
              placeholder="e.g., Sunset Apartments, Palm Heights"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              className="text-lg h-12"
            />
            <p className="text-sm text-muted-foreground">
              This will be used as a prefix for all unit type listings
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location" className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              placeholder="e.g., Kololo, Kampala"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="totalFloors" className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Number of Floors *
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTotalFloors(Math.max(1, totalFloors - 1))}
              >
                -
              </Button>
              <span className="text-2xl font-bold w-16 text-center">{totalFloors}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setTotalFloors(Math.min(50, totalFloors + 1))}
              >
                +
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You can configure unit types per floor in the next step
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="landlord" className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Property Owner (Optional)
            </Label>
            <Select value={selectedLandlordId} onValueChange={setSelectedLandlordId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select landlord (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None - Unassigned</SelectItem>
                {landlords.map((landlord) => (
                  <SelectItem key={landlord.id} value={landlord.id}>
                    {landlord.business_name || landlord.profiles?.full_name || landlord.profiles?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Assign this building to a landlord for ownership tracking
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info box about next steps */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">What's next?</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Step 2:</strong> Configure which unit types are on each floor</li>
          <li>• <strong>Step 3:</strong> Add images, pricing, features & description for each unit type</li>
          <li>• <strong>Step 4:</strong> Review and create your listings</li>
        </ul>
      </div>
    </div>
  )
}

// Step 2: Floor Configuration Component
function FloorConfigStep({
  totalFloors,
  floorConfig,
  onConfigChange
}: {
  totalFloors: number
  floorConfig: FloorUnitTypeConfiguration | null
  onConfigChange: (config: FloorUnitTypeConfiguration) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold">Configure your floors</h3>
        <p className="text-muted-foreground mt-2">
          Set up unit types and quantities for each floor
        </p>
      </div>

      <FloorUnitTypeConfigurator
        totalFloors={totalFloors}
        onChange={onConfigChange}
        initialConfig={floorConfig || undefined}
      />
    </div>
  )
}

// Step 3: Unit Type Details with improved UX
function UnitTypeDetailsStep({
  floorConfig,
  onConfigChange,
  buildingName
}: {
  floorConfig: FloorUnitTypeConfiguration | null
  onConfigChange: (config: FloorUnitTypeConfiguration) => void
  buildingName: string
}) {
  // Get unique unit types for progress tracking
  const uniqueUnitTypes = React.useMemo(() => {
    if (!floorConfig) return []
    const types = new Set<string>()
    floorConfig.floors.forEach(floor => {
      floor.unitTypes.forEach(ut => types.add(ut.type))
    })
    return Array.from(types).sort()
  }, [floorConfig])

  // Calculate completion status for each unit type
  const getUnitTypeStatus = (type: string) => {
    const details = floorConfig?.unitTypeDetails?.find(d => d.type === type)
    const hasImages = (details?.images?.length || 0) > 0 || !!details?.imageUrl
    const hasDescription = !!details?.description?.trim()
    return { hasImages, hasDescription, isComplete: hasImages && hasDescription }
  }

  const completedCount = uniqueUnitTypes.filter(type => getUnitTypeStatus(type).isComplete).length
  const totalCount = uniqueUnitTypes.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ImageIcon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-semibold">Add Images & Details</h3>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          Each unit type becomes its own listing. Upload multiple photos (living room, bedroom, kitchen, bathroom) 
          and add a description to make your listings stand out.
        </p>
      </div>

      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Unit Types Configured</span>
            <span className="text-sm text-muted-foreground">{completedCount} of {totalCount} complete</span>
          </div>
          <div className="flex gap-2">
            {uniqueUnitTypes.map(type => {
              const typeInfo = UNIT_TYPES.find(t => t.value === type)
              const status = getUnitTypeStatus(type)
              return (
                <div 
                  key={type}
                  className={`flex-1 h-2 rounded-full ${status.isComplete ? typeInfo?.color || 'bg-primary' : 'bg-muted'}`}
                  title={`${typeInfo?.label}: ${status.isComplete ? 'Complete' : status.hasImages ? 'Needs description' : 'Needs images'}`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {uniqueUnitTypes.map(type => {
              const typeInfo = UNIT_TYPES.find(t => t.value === type)
              const status = getUnitTypeStatus(type)
              return (
                <Badge 
                  key={type} 
                  variant={status.isComplete ? "default" : "outline"}
                  className={`gap-1.5 ${status.isComplete ? '' : 'border-dashed'}`}
                >
                  {status.isComplete ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${typeInfo?.color || 'bg-gray-500'}`} />
                  )}
                  {typeInfo?.label || type}
                </Badge>
              )
            })}
          </div>
        </div>
      )}
      
      {/* The FloorUnitTypeConfigurator with details tab */}
      {floorConfig && (
        <FloorUnitTypeConfigurator
          totalFloors={floorConfig.totalFloors}
          onChange={onConfigChange}
          initialConfig={floorConfig}
        />
      )}

      {/* Tip box */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
        <p className="text-sm">
          <strong className="text-amber-600">💡 Pro tip:</strong> Properties with 5+ high-quality photos get 3x more views. 
          Include images of each room and highlight unique features like balconies, views, or modern finishes.
        </p>
      </div>
    </div>
  )
}

// Step 4: Review Component
function ReviewStep({
  buildingName,
  location,
  floorConfig
}: {
  buildingName: string
  location: string
  floorConfig: FloorUnitTypeConfiguration | null
}) {
  // Calculate statistics
  const getStats = () => {
    if (!floorConfig) return { totalUnits: 0, unitTypes: [], typeStats: {} as Record<string, number> }
    
    const typeStats: Record<string, number> = {}
    let totalUnits = 0
    
    floorConfig.floors.forEach(floor => {
      floor.unitTypes.forEach(ut => {
        typeStats[ut.type] = (typeStats[ut.type] || 0) + ut.count
        totalUnits += ut.count
      })
    })
    
    return { totalUnits, unitTypes: Object.keys(typeStats), typeStats }
  }

  const stats = getStats()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-semibold">Review your apartment</h3>
        <p className="text-muted-foreground mt-2">
          Confirm the details before creating your listings
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Building</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{buildingName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {location}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{floorConfig?.totalFloors || 0} Floors</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalUnits} total units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listings to be created */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Listings to be created
          </CardTitle>
          <CardDescription>
            Each unit type will become a separate property listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.unitTypes.map(type => {
              const typeInfo = UNIT_TYPES.find(t => t.value === type)
              const count = stats.typeStats[type]
              const details = floorConfig?.unitTypeDetails?.find(d => d.type === type)
              const images = details?.images || []
              const primaryImage = images.find(img => img.isPrimary)?.url || details?.imageUrl
              const imageCount = images.length || (details?.imageUrl ? 1 : 0)
              
              return (
                <div key={type} className={`p-4 rounded-lg border bg-muted/30 border-l-4 ${typeInfo?.borderColor || 'border-gray-500'}`}>
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${typeInfo?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {details?.title || `${buildingName} - ${typeInfo?.label || type}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {count} unit{count !== 1 ? 's' : ''} • {typeInfo?.label || type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={imageCount > 0 ? "default" : "outline"} className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {imageCount}
                      </Badge>
                      {details?.description && (
                        <Badge variant="default" className="gap-1">
                          <FileText className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Specs Row */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {details?.priceUgx && details.priceUgx > 0 && (
                      <Badge variant="secondary" className="gap-1 text-green-600 bg-green-500/10">
                        UGX {new Intl.NumberFormat('en-US').format(details.priceUgx)}/mo
                      </Badge>
                    )}
                    {details?.area && (
                      <Badge variant="outline" className="gap-1">
                        {details.area} m²
                      </Badge>
                    )}
                    {(details?.features?.length || 0) > 0 && (
                      <Badge variant="outline" className="gap-1">
                        {details?.features?.length} features
                      </Badge>
                    )}
                    {(details?.amenities?.length || 0) > 0 && (
                      <Badge variant="outline" className="gap-1">
                        {details?.amenities?.length} amenities
                      </Badge>
                    )}
                  </div>

                  {/* Image Gallery Preview */}
                  {imageCount > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {images.length > 0 ? (
                        images.slice(0, 5).map((img, idx) => (
                          <div key={img.id} className="relative flex-shrink-0">
                            <img 
                              src={img.url} 
                              alt={`${type} - ${img.category}`}
                              className={`w-16 h-16 rounded object-cover ${img.isPrimary ? 'ring-2 ring-primary' : ''}`}
                            />
                            {img.isPrimary && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <img 
                          src={details?.imageUrl || ''} 
                          alt={type}
                          className="w-16 h-16 rounded object-cover ring-2 ring-primary"
                        />
                      )}
                      {images.length > 5 && (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">+{images.length - 5}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/20">
                      <ImageIcon className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-600">No images added - listings perform better with photos</span>
                    </div>
                  )}

                  {/* Description preview */}
                  {details?.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {details.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApartmentCreationWizard
