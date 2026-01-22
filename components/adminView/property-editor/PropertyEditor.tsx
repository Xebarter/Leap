'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FileText, DollarSign, Image, MapPin, Settings, Loader2 } from 'lucide-react'

import { EditorHeader } from './EditorHeader'
import { EditorSidebar, EditorMobileTabs } from './EditorSidebar'
import { usePropertyForm } from './hooks/usePropertyForm'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { PropertyFormData, EditorSection, SaveStatus } from './types'

import { BasicInfoSection } from './sections/BasicInfoSection'
import { PricingSection } from './sections/PricingSection'
import { MediaSection } from './sections/MediaSection'
import { LocationSection } from './sections/LocationSection'
import { SettingsSection } from './sections/SettingsSection'

const SECTIONS: EditorSection[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    description: 'Title, category, description',
    icon: FileText,
    isComplete: (data) => !!(data.title && data.location && data.description && data.category),
    hasErrors: (errors) => !!(errors.title || errors.location || errors.description || errors.category),
  },
  {
    id: 'pricing',
    title: 'Pricing & Details',
    description: 'Rent, bedrooms, bathrooms',
    icon: DollarSign,
    isComplete: (data) => !!(data.price_ugx > 0 && data.bedrooms >= 0 && data.bathrooms >= 0),
    hasErrors: (errors) => !!(errors.price_ugx || errors.bedrooms || errors.bathrooms || errors.minimum_initial_months),
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Photos and videos',
    icon: Image,
    isComplete: (data) => !!(data.image_url || (data.image_urls && data.image_urls.length > 0)),
    hasErrors: () => false,
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Google Maps',
    icon: MapPin,
    isComplete: (data) => !!data.google_maps_embed_url,
    hasErrors: () => false,
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Block, featured status',
    icon: Settings,
    isComplete: () => true,
    hasErrors: () => false,
  },
]

interface PropertyEditorProps {
  propertyId?: string
  initialData?: Partial<PropertyFormData>
  blocks?: Array<{ id: string; name: string; location: string }>
  isNew?: boolean
}

export function PropertyEditor({ propertyId, initialData, blocks = [], isNew = false }: PropertyEditorProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('basic')
  const [isLoading, setIsLoading] = useState(!isNew && !!propertyId)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' })

  const { formData, errors, isDirty, validateAll, setData, getCompletionPercentage, updateField, touchField } = usePropertyForm({ initialData })
  const { safeNavigate, forceNavigate } = useUnsavedChanges({ hasChanges: isDirty })

  useEffect(() => {
    if (!isNew && propertyId) {
      loadProperty()
    }
  }, [propertyId, isNew])

  const loadProperty = async () => {
    if (!propertyId) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single()

      if (error) throw error

      if (data) {
        setData({
          id: data.id,
          title: data.title || '',
          location: data.location || '',
          description: data.description || '',
          price_ugx: data.price_ugx ? data.price_ugx / 100 : 0,
          category: data.category || '',
          bedrooms: data.bedrooms || 0,
          bathrooms: data.bathrooms || 0,
          image_url: data.image_url || '',
          image_urls: data.image_urls || [],
          video_url: data.video_url || '',
          minimum_initial_months: data.minimum_initial_months || 1,
          total_floors: data.total_floors || 1,
          units_config: data.units_config || '',
          block_id: data.block_id,
          google_maps_embed_url: data.google_maps_embed_url || '',
          is_featured: data.is_featured || false,
          property_code: data.property_code,
        })
      }
    } catch (error) {
      console.error('Error loading property:', error)
      toast.error('Failed to load property')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = useCallback(async () => {
    const validationErrors = validateAll()
    if (Object.keys(validationErrors).length > 0) {
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
      const supabase = createClient()
      const propertyData = {
        title: formData.title,
        location: formData.location,
        description: formData.description,
        price_ugx: Math.round(formData.price_ugx * 100),
        category: formData.category,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        image_url: formData.image_url,
        image_urls: formData.image_urls,
        video_url: formData.video_url,
        minimum_initial_months: formData.minimum_initial_months,
        total_floors: formData.total_floors,
        units_config: formData.units_config,
        block_id: formData.block_id || null,
        google_maps_embed_url: formData.google_maps_embed_url,
        is_featured: formData.is_featured,
        is_active: true,
      }

      if (isNew) {
        const { data, error } = await supabase.from('properties').insert(propertyData).select().single()
        if (error) throw error
        toast.success('Property created successfully!')
        setSaveStatus({ status: 'saved', lastSaved: new Date() })
        forceNavigate(`/admin/properties/${data.id}/edit`)
      } else {
        const { error } = await supabase.from('properties').update(propertyData).eq('id', propertyId)
        if (error) throw error
        toast.success('Property saved successfully!')
        setSaveStatus({ status: 'saved', lastSaved: new Date() })
      }
    } catch (err: any) {
      console.error('Save error:', err)
      const msg = err?.message || 'Failed to save property'
      toast.error(msg)
      setSaveStatus({ status: 'error', error: msg })
    } finally {
      setIsSaving(false)
    }
  }, [formData, isNew, propertyId, validateAll, forceNavigate])

  const handleDelete = useCallback(async () => {
    if (!propertyId) return
    if (!window.confirm('Are you sure you want to delete this property?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('properties').delete().eq('id', propertyId)
      if (error) throw error
      toast.success('Property deleted')
      forceNavigate('/admin/properties')
    } catch (error) {
      console.error('Error deleting property:', error)
      toast.error('Failed to delete property')
    }
  }, [propertyId, forceNavigate])

  const handleToggleFeatured = useCallback(() => {
    updateField('is_featured', !formData.is_featured)
  }, [formData.is_featured, updateField])

  const handlePreview = useCallback(() => {
    if (propertyId) {
      window.open(`/properties/${propertyId}`, '_blank')
    }
  }, [propertyId])

  const handleBack = useCallback(() => {
    safeNavigate('/admin/properties')
  }, [safeNavigate])

  const renderSection = () => {
    const commonProps = { formData, errors, onUpdate: updateField, onBlur: touchField }

    switch (activeSection) {
      case 'basic':
        return <BasicInfoSection {...commonProps} />
      case 'pricing':
        return <PricingSection {...commonProps} />
      case 'media':
        return <MediaSection formData={formData} propertyId={propertyId} onUpdate={updateField} />
      case 'location':
        return <LocationSection formData={formData} onUpdate={updateField} />
      case 'settings':
        return <SettingsSection formData={formData} blocks={blocks} onUpdate={updateField} />
      default:
        return <BasicInfoSection {...commonProps} />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EditorHeader
        title={formData.title}
        propertyCode={formData.property_code}
        isNew={isNew}
        isDirty={isDirty}
        saveStatus={saveStatus}
        completionPercentage={getCompletionPercentage()}
        onSave={handleSave}
        onBack={handleBack}
        onDelete={!isNew ? handleDelete : undefined}
        onPreview={!isNew ? handlePreview : undefined}
        onToggleFeatured={handleToggleFeatured}
        isFeatured={formData.is_featured}
      />

      <EditorMobileTabs
        sections={SECTIONS}
        activeSection={activeSection}
        formData={formData}
        errors={errors}
        onSectionChange={setActiveSection}
      />

      <div className="flex-1 flex">
        <EditorSidebar
          sections={SECTIONS}
          activeSection={activeSection}
          formData={formData}
          errors={errors}
          onSectionChange={setActiveSection}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-8">{renderSection()}</div>
        </main>
      </div>
    </div>
  )
}
