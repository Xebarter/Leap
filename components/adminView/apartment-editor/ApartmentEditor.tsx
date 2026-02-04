'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Layers, Home, Image as ImageIcon, CheckSquare, Loader2 } from 'lucide-react'

import { ApartmentEditorHeader } from './ApartmentEditorHeader'
import { ApartmentEditorSidebar, ApartmentEditorMobileTabs } from './ApartmentEditorSidebar'
import { useApartmentForm } from './hooks/useApartmentForm'
import { 
  ApartmentFormData, 
  ApartmentEditorSection, 
  ApartmentSaveStatus,
  ApartmentValidationErrors
} from './types'
import {
  BuildingInfoSection,
  FloorsConfigSection,
  UnitTypesSection,
  MediaSection,
  ReviewSection
} from './sections'
import { FloorUnitTypeConfiguration } from '../floor-unit-type-configurator'

// Helper functions for building type
function getBuildingTypeLabel(type: string): string {
  switch (type) {
    case 'hostel': return 'Hostel'
    case 'office': return 'Office'
    case 'apartment':
    default: return 'Apartment'
  }
}

function getCategoryFromBuildingType(type: string): string {
  switch (type) {
    case 'hostel': return 'Hostel'
    case 'office': return 'Office'
    case 'apartment':
    default: return 'Apartment'
  }
}

// Define sections for the apartment editor
const SECTIONS: ApartmentEditorSection[] = [
  {
    id: 'building',
    title: 'Building Info',
    description: 'Name, location, floors',
    icon: Building2,
    isComplete: (data) => !!(data.buildingName && data.location && data.totalFloors > 0),
    hasErrors: (errors) => !!(errors.buildingName || errors.location || errors.totalFloors),
  },
  {
    id: 'floors',
    title: 'Floors & Units',
    description: 'Configure structure',
    icon: Layers,
    isComplete: (data) => data.floorConfig.length > 0 && data.floorConfig.some(f => f.unitTypes.length > 0),
    hasErrors: (errors) => !!errors.floorConfig,
  },
  {
    id: 'unit-types',
    title: 'Unit Types',
    description: 'Details per type',
    icon: Home,
    isComplete: (data) => data.unitTypeDetails.length > 0 && data.unitTypeDetails.some(d => d.description && d.priceUgx),
    hasErrors: (errors) => !!errors.unitTypeDetails,
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Building photos',
    icon: ImageIcon,
    isComplete: (data) => !!(data.buildingImageUrl || (data.buildingImageUrls && data.buildingImageUrls.length > 0)),
    hasErrors: () => false,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm and create',
    icon: CheckSquare,
    isComplete: () => true,
    hasErrors: () => false,
  },
]

interface ApartmentEditorProps {
  blockId?: string
  initialData?: Partial<ApartmentFormData>
  isNew?: boolean
  buildingType?: string // 'apartment', 'hostel', or 'office'
}

export function ApartmentEditor({ blockId, initialData, isNew = false, buildingType = 'apartment' }: ApartmentEditorProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('building')
  const [isLoading, setIsLoading] = useState(!isNew && !!blockId)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<ApartmentSaveStatus>({ status: 'idle' })

  const {
    formData,
    errors,
    isDirty,
    validateAll,
    setData,
    getCompletionPercentage,
    updateField,
    updateFloorConfig,
    updateUnitTypeDetails,
    updateSingleUnitTypeDetails,
    touchField,
    uniqueUnitTypes,
    buildingSummary,
  } = useApartmentForm({ initialData })

  // Load existing apartment data
  useEffect(() => {
    if (!isNew && blockId) {
      loadApartmentData()
    }
  }, [blockId, isNew])

  const loadApartmentData = async () => {
    if (!blockId) return
    setIsLoading(true)
    
    try {
      // Import the fetch function dynamically
      const { fetchApartmentBlockData } = await import('../property-manager/apartment-edit-service')
      
      // We need to find a property with this block_id to get the data
      // For now, we'll fetch via the API
      const response = await fetch(`/api/properties?block_id=${blockId}`)
      if (!response.ok) throw new Error('Failed to load apartment data')
      
      const data = await response.json()
      if (data.properties && data.properties.length > 0) {
        const firstProperty = data.properties[0]
        const blockData = await fetchApartmentBlockData(firstProperty.id)
        
        if (blockData) {
          setData({
            blockId: blockData.blockId,
            buildingName: blockData.buildingName,
            location: blockData.location,
            totalFloors: blockData.totalFloors,
            minimumInitialMonths: blockData.minimumInitialMonths,
            floorConfig: blockData.floorConfig.floors,
            unitTypeDetails: blockData.floorConfig.unitTypeDetails || [],
          })
        }
      }
    } catch (error) {
      console.error('Error loading apartment data:', error)
      toast.error('Failed to load apartment data')
    } finally {
      setIsLoading(false)
    }
  }

  // Save apartment
  const handleSave = useCallback(async () => {
    const validationErrors = validateAll()
    if (Object.keys(validationErrors).length > 0) {
      // Navigate to first section with errors
      for (const section of SECTIONS) {
        if (section.hasErrors(validationErrors)) {
          setActiveSection(section.id)
          break
        }
      }
      toast.error('Please fix the errors before saving')
      return
    }

    setIsSaving(true)
    setSaveStatus({ status: 'saving' })

    try {
      // Build the floor configuration object
      const floorUnitConfig: FloorUnitTypeConfiguration = {
        totalFloors: formData.totalFloors,
        floors: formData.floorConfig,
        unitTypeDetails: formData.unitTypeDetails,
      }

      const payload = {
        title: formData.buildingName,
        building_name: formData.buildingName,
        location: formData.location,
        description: `${getBuildingTypeLabel(buildingType)} building at ${formData.location}`,
        price: 0,
        category: getCategoryFromBuildingType(buildingType),
        bedrooms: 1,
        bathrooms: 1,
        total_floors: formData.totalFloors,
        units_config: '',
        floor_unit_config: floorUnitConfig,
        minimum_initial_months: formData.minimumInitialMonths,
        google_maps_embed_url: formData.googleMapsEmbedUrl,
        image_url: formData.buildingImageUrl,
        image_urls: formData.buildingImageUrls,
        video_url: formData.buildingVideoUrl,
        // Edit mode fields
        block_id: formData.blockId,
        is_edit_mode: !isNew && !!formData.blockId,
      }

      const response = await fetch('/api/properties', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save apartment')
      }

      toast.success(isNew ? 'Apartment building created successfully!' : 'Changes saved successfully!')
      setSaveStatus({ status: 'saved', lastSaved: new Date() })

      if (isNew && result.blockId) {
        // Navigate to edit page for the new building
        router.push(`/admin/properties/apartment/${result.blockId}/edit`)
      }
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save apartment')
      setSaveStatus({ status: 'error', error: error.message })
    } finally {
      setIsSaving(false)
    }
  }, [formData, isNew, validateAll, router])

  // Delete apartment
  const handleDelete = useCallback(async () => {
    if (!blockId) return
    if (!window.confirm('Are you sure you want to delete this apartment building? This will delete all associated properties and units.')) return

    try {
      const response = await fetch(`/api/properties?block_id=${blockId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete apartment')
      }

      toast.success('Apartment building deleted')
      // Check if we came from the buildings page
      const currentPath = window.location.pathname
      if (currentPath.includes('/admin/buildings/')) {
        router.push('/admin/buildings')
      } else {
        router.push('/admin/properties')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete apartment')
    }
  }, [blockId, router])

  // Navigate back
  const handleBack = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return
    }
    // Check if we came from the buildings page
    const currentPath = window.location.pathname
    if (currentPath.includes('/admin/buildings/')) {
      router.push('/admin/buildings')
    } else {
      router.push('/admin/properties')
    }
  }, [isDirty, router])

  // Render section content
  const renderSection = () => {
    switch (activeSection) {
      case 'building':
        return (
          <BuildingInfoSection
            formData={formData}
            errors={errors}
            onUpdate={updateField}
            onBlur={touchField}
          />
        )
      case 'floors':
        return (
          <FloorsConfigSection
            formData={formData}
            errors={errors}
            onUpdateFloorConfig={updateFloorConfig}
            onUpdateUnitTypeDetails={updateUnitTypeDetails}
            buildingName={formData.buildingName}
            buildingLocation={formData.location}
            blockId={formData.blockId}
            buildingType={buildingType}
          />
        )
      case 'unit-types':
        return (
          <UnitTypesSection
            formData={formData}
            uniqueUnitTypes={uniqueUnitTypes}
            onUpdateUnitTypeDetails={updateSingleUnitTypeDetails}
            buildingName={formData.buildingName}
            buildingType={buildingType}
          />
        )
      case 'media':
        return (
          <MediaSection
            formData={formData}
            uniqueUnitTypes={uniqueUnitTypes}
            onUpdate={updateField}
            onUpdateUnitTypeDetails={updateSingleUnitTypeDetails}
          />
        )
      case 'review':
        return (
          <ReviewSection
            formData={formData}
            uniqueUnitTypes={uniqueUnitTypes}
            buildingType={buildingType}
          />
        )
      default:
        return (
          <BuildingInfoSection
            formData={formData}
            errors={errors}
            onUpdate={updateField}
            onBlur={touchField}
          />
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading apartment data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ApartmentEditorHeader
        buildingName={formData.buildingName}
        blockId={formData.blockId}
        isNew={isNew}
        isDirty={isDirty}
        saveStatus={saveStatus}
        completionPercentage={getCompletionPercentage()}
        onSave={handleSave}
        onBack={handleBack}
        onDelete={!isNew ? handleDelete : undefined}
        isSaving={isSaving}
        buildingType={buildingType}
      />

      <ApartmentEditorMobileTabs
        sections={SECTIONS}
        activeSection={activeSection}
        formData={formData}
        errors={errors}
        onSectionChange={setActiveSection}
      />

      <div className="flex-1 flex">
        <ApartmentEditorSidebar
          sections={SECTIONS}
          activeSection={activeSection}
          formData={formData}
          errors={errors}
          onSectionChange={setActiveSection}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {renderSection()}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between border-t pt-6">
              {activeSection !== 'building' ? (
                <button
                  onClick={() => {
                    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection)
                    if (currentIndex > 0) {
                      setActiveSection(SECTIONS[currentIndex - 1].id)
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Previous: {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) - 1]?.title}
                </button>
              ) : (
                <div />
              )}
              
              {activeSection !== 'review' ? (
                <button
                  onClick={() => {
                    const currentIndex = SECTIONS.findIndex(s => s.id === activeSection)
                    if (currentIndex < SECTIONS.length - 1) {
                      setActiveSection(SECTIONS[currentIndex + 1].id)
                    }
                  }}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Next: {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) + 1]?.title} →
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
