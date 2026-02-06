'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Home, ImageIcon, FileText, DollarSign, Ruler, BedDouble, Bath,
  Video, Calendar, Clock, PawPrint, Zap, Check, ChevronDown, ChevronUp,
  Sparkles, Info, X, Upload, Plus
} from 'lucide-react'
import { UnitTypeImageUpload } from './unit-type-image-upload'
import type { UnitTypeDetails, UnitTypeImage } from './floor-unit-type-configurator'

// Common features for apartments
const COMMON_FEATURES = [
  'Air Conditioning',
  'Balcony',
  'Built-in Wardrobes',
  'Ceiling Fans',
  'En-suite Bathroom',
  'Hardwood Floors',
  'High Ceilings',
  'Modern Kitchen',
  'Open Floor Plan',
  'Walk-in Closet',
  'Washer/Dryer',
  'Water Heater',
]

// Common amenities for buildings
const COMMON_AMENITIES = [
  '24/7 Security',
  'Backup Generator',
  'CCTV Surveillance',
  'Children\'s Play Area',
  'Elevator',
  'Fitness Center',
  'Gated Community',
  'Laundry Room',
  'Parking',
  'Rooftop Access',
  'Swimming Pool',
  'Water Tank',
]

// Utilities options
const UTILITIES_OPTIONS = [
  'Electricity',
  'Water',
  'Internet',
  'Cable TV',
  'Gas',
  'Garbage Collection',
]

// Quick add detail templates - Residential (apartments, hostels)
const RESIDENTIAL_DETAIL_TEMPLATES = [
  { type: 'Bedroom', name: 'Master Bedroom', icon: '🛏️' },
  { type: 'Bedroom', name: 'Guest Bedroom', icon: '🛏️' },
  { type: 'Bathroom', name: 'Master Bathroom', icon: '🚿' },
  { type: 'Bathroom', name: 'Guest Bathroom', icon: '🚿' },
  { type: 'Kitchen', name: 'Modern Kitchen', icon: '🍳' },
  { type: 'Living Room', name: 'Spacious Living Room', icon: '🛋️' },
  { type: 'Dining Room', name: 'Dining Area', icon: '🍽️' },
  { type: 'Balcony', name: 'Balcony', icon: '🌆' },
  { type: 'Garden', name: 'Garden', icon: '🌳' },
  { type: 'Pool', name: 'Swimming Pool', icon: '🏊' },
  { type: 'Garage', name: 'Parking Garage', icon: '🚗' },
  { type: 'Gym', name: 'Fitness Center', icon: '💪' },
]

// Quick add detail templates - Office/Commercial
const OFFICE_DETAIL_TEMPLATES = [
  { type: 'Office Space', name: 'Open Plan Area', icon: '💼' },
  { type: 'Office Space', name: 'Private Offices', icon: '🚪' },
  { type: 'Meeting Room', name: 'Conference Room', icon: '📊' },
  { type: 'Meeting Room', name: 'Boardroom', icon: '🎯' },
  { type: 'Kitchen', name: 'Kitchenette', icon: '☕' },
  { type: 'Kitchen', name: 'Break Room', icon: '🍽️' },
  { type: 'Reception', name: 'Reception Area', icon: '🏢' },
  { type: 'Storage', name: 'Storage Room', icon: '📦' },
  { type: 'Server Room', name: 'Server/IT Room', icon: '💻' },
  { type: 'Lounge', name: 'Lounge Area', icon: '🛋️' },
  { type: 'Parking', name: 'Parking Spaces', icon: '🅿️' },
  { type: 'Restroom', name: 'Restrooms', icon: '🚻' },
]

// Legacy export for backward compatibility
const DETAIL_TEMPLATES = RESIDENTIAL_DETAIL_TEMPLATES

// Property detail image interface
export interface PropertyDetailImage {
  id: string
  url: string
  file?: File // For pending uploads
}

// Property detail interface
export interface PropertyDetail {
  id: string
  type: string
  name: string
  description?: string
  images?: PropertyDetailImage[]
}

interface UnitTypePropertyFormProps {
  unitType: string
  unitTypeLabel: string
  unitTypeColor: string
  unitTypeBorderColor: string
  unitCount: number
  details: UnitTypeDetails
  buildingName: string
  buildingLocation: string
  defaultBedrooms: number
  defaultBathrooms: number
  onDetailsChange: (details: Partial<UnitTypeDetails>) => void
  onPriceChangeAcrossAllFloors?: (type: string, price: number) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  buildingType?: string // 'apartment', 'hostel', or 'office'
}

export function UnitTypePropertyForm({
  unitType,
  unitTypeLabel,
  unitTypeColor,
  unitTypeBorderColor,
  unitCount,
  details,
  buildingName,
  buildingLocation,
  defaultBedrooms,
  defaultBathrooms,
  onDetailsChange,
  onPriceChangeAcrossAllFloors,
  isExpanded = true,
  onToggleExpand,
  buildingType = 'apartment'
}: UnitTypePropertyFormProps) {
  
  // Get appropriate templates based on building type
  const detailTemplates = buildingType === 'office' ? OFFICE_DETAIL_TEMPLATES : RESIDENTIAL_DETAIL_TEMPLATES
  const [activeTab, setActiveTab] = useState('images')
  
  // Handle price change with deferred sync
  const handlePriceChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value ? parseInt(e.target.value) : 0
    
    // Update unit type details first
    onDetailsChange({ priceUgx: price })
    
    // Sync to all floors after a short delay to avoid state update during render
    if (onPriceChangeAcrossAllFloors) {
      Promise.resolve().then(() => {
        onPriceChangeAcrossAllFloors(unitType, price)
      })
    }
  }, [unitType, onDetailsChange, onPriceChangeAcrossAllFloors])
  
  // Calculate completion percentage
  const getCompletionStatus = () => {
    let completed = 0
    let total = 5 // Images, Description, Price, Features, Specs
    
    if ((details.images?.length || 0) > 0 || details.imageUrl) completed++
    if (details.description?.trim()) completed++
    if (details.priceUgx && details.priceUgx > 0) completed++
    if ((details.features?.length || 0) > 0 || (details.amenities?.length || 0) > 0) completed++
    if (details.area && details.area > 0) completed++
    
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }
  
  const completion = getCompletionStatus()
  const imageCount = details.images?.length || (details.imageUrl ? 1 : 0)

  // Toggle feature selection
  const toggleFeature = (feature: string) => {
    const current = details.features || []
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature]
    onDetailsChange({ features: updated })
  }

  // Toggle amenity selection
  const toggleAmenity = (amenity: string) => {
    const current = details.amenities || []
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity]
    onDetailsChange({ amenities: updated })
  }

  // Toggle utility selection
  const toggleUtility = (utility: string) => {
    const current = details.utilities || []
    const updated = current.includes(utility)
      ? current.filter(u => u !== utility)
      : [...current, utility]
    onDetailsChange({ utilities: updated })
  }

  return (
    <Card className={`overflow-hidden border-l-4 ${unitTypeBorderColor}`}>
      {/* Collapsible Header */}
      <CardHeader 
        className={`pb-3 cursor-pointer hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${unitTypeColor} flex items-center justify-center flex-shrink-0`}>
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {unitTypeLabel}
                <Badge variant="secondary" className="font-normal">
                  {unitCount} unit{unitCount !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {details.title || `${buildingName} - ${unitTypeLabel}`}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Completion indicator */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full ${i < completion.completed ? unitTypeColor : 'bg-muted'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{completion.percentage}%</span>
            </div>
            
            {/* Quick status badges */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant={imageCount > 0 ? "default" : "outline"} className="gap-1">
                <ImageIcon className="h-3 w-3" />
                {imageCount}
              </Badge>
              {details.priceUgx && details.priceUgx > 0 && (
                <Badge variant="default" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                </Badge>
              )}
            </div>
            
            {/* Expand/Collapse button */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Expandable Content */}
      {isExpanded && (
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="images" className="gap-1.5 text-xs sm:text-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Images</span>
                {imageCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{imageCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-1.5 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-1.5 text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Features</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1.5 text-xs sm:text-sm">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pricing</span>
              </TabsTrigger>
            </TabsList>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4 mt-0">
              <UnitTypeImageUpload
                unitType={unitType}
                unitTypeLabel={unitTypeLabel}
                unitTypeColor={unitTypeColor}
                images={details.images || []}
                onImagesChange={(newImages) => {
                  const primaryImage = newImages.find(img => img.isPrimary)
                  onDetailsChange({ 
                    images: newImages,
                    imageUrl: primaryImage?.url || newImages[0]?.url || undefined
                  })
                }}
                maxImages={10}
              />
              
              {/* Video URL */}
              <div className="pt-4 border-t">
                <Label htmlFor={`video-${unitType}`} className="text-sm flex items-center gap-2 mb-2">
                  <Video className="h-4 w-4" />
                  Video Tour URL (optional)
                </Label>
                <Input
                  id={`video-${unitType}`}
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  value={details.videoUrl || ''}
                  onChange={(e) => onDetailsChange({ videoUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add a YouTube or Vimeo link for a virtual tour
                </p>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-0">
              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor={`title-${unitType}`} className="text-sm">
                  Listing Title
                </Label>
                <Input
                  id={`title-${unitType}`}
                  placeholder={`e.g., Modern ${unitTypeLabel} in ${buildingName}`}
                  value={details.title || ''}
                  onChange={(e) => onDetailsChange({ title: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Default: "{buildingName} - {unitTypeLabel}"
                </p>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor={`desc-${unitType}`} className="text-sm">
                  Property Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id={`desc-${unitType}`}
                  placeholder={`Describe this ${unitTypeLabel} unit - layout, finishes, views, what makes it special...`}
                  value={details.description || ''}
                  onChange={(e) => onDetailsChange({ description: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Detailed descriptions attract more inquiries</span>
                  <span>{(details.description || '').length} characters</span>
                </div>
              </div>

              {/* Quick Add Common Details Section */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Quick Add Common Details</Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Add rooms and areas to highlight in this listing
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {detailTemplates.map((template, idx) => {
                    const isAdded = details.propertyDetails?.some(
                      d => d.type === template.type && d.name === template.name
                    )
                    return (
                      <Button
                        key={idx}
                        type="button"
                        variant={isAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isAdded) {
                            // Remove the detail
                            const updated = (details.propertyDetails || []).filter(
                              d => !(d.type === template.type && d.name === template.name)
                            )
                            onDetailsChange({ propertyDetails: updated })
                          } else {
                            // Add the detail
                            const newDetail: PropertyDetail = {
                              id: `detail-${Date.now()}-${idx}`,
                              type: template.type,
                              name: template.name,
                              description: '',
                              images: []
                            }
                            onDetailsChange({ 
                              propertyDetails: [...(details.propertyDetails || []), newDetail]
                            })
                          }
                        }}
                        className={`relative flex items-center justify-between gap-2 h-auto min-h-[3rem] py-2 px-3 ${isAdded ? 'bg-primary/10 border-primary' : ''}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg shrink-0 leading-none">{template.icon}</span>
                          <span className="text-[11px] font-medium leading-tight line-clamp-2 overflow-hidden text-left hyphens-auto" style={{ wordBreak: 'break-word' }}>
                            {template.name}
                          </span>
                        </div>
                        {isAdded && <Check className="h-4 w-4 shrink-0 text-primary ml-1" />}
                      </Button>
                    )
                  })}
                </div>

                {/* Show added details with description fields and image upload */}
                {(details.propertyDetails?.length || 0) > 0 && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-sm font-medium">Added Details ({details.propertyDetails?.length})</Label>
                    <div className="space-y-3">
                      {details.propertyDetails?.map((detail) => {
                        const template = detailTemplates.find(
                          t => t.type === detail.type && t.name === detail.name
                        )
                        return (
                          <div key={detail.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                            {/* Header row */}
                            <div className="flex items-start gap-3">
                              <span className="text-xl">{template?.icon || '📦'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm">{detail.name}</span>
                                  <Badge variant="secondary" className="text-xs">{detail.type}</Badge>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Description (Optional)</Label>
                                  <Input
                                    placeholder={`Describe the ${detail.name.toLowerCase()}...`}
                                    value={detail.description || ''}
                                    onChange={(e) => {
                                      const updated = (details.propertyDetails || []).map(d =>
                                        d.id === detail.id ? { ...d, description: e.target.value } : d
                                      )
                                      onDetailsChange({ propertyDetails: updated })
                                    }}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const updated = (details.propertyDetails || []).filter(d => d.id !== detail.id)
                                  onDetailsChange({ propertyDetails: updated })
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Image Upload Section */}
                            <div className="space-y-2 pl-9">
                              <Label className="text-xs text-muted-foreground">Images (Optional)</Label>
                              
                              {/* Existing Images Grid */}
                              {(detail.images?.length || 0) > 0 && (
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-2">
                                  {detail.images?.map((img) => (
                                    <div key={img.id} className="relative group aspect-square">
                                      <img
                                        src={img.url}
                                        alt={detail.name}
                                        className="object-cover w-full h-full rounded-md border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          const updatedImages = (detail.images || []).filter(i => i.id !== img.id)
                                          const updated = (details.propertyDetails || []).map(d =>
                                            d.id === detail.id ? { ...d, images: updatedImages } : d
                                          )
                                          onDetailsChange({ propertyDetails: updated })
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Upload Area */}
                              <div className="relative border border-dashed rounded-md p-3 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
                                <input
                                  type="file"
                                  id={`detail-image-upload-${detail.id}`}
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      const newImages = Array.from(e.target.files).map((file, idx) => ({
                                        id: `img-${Date.now()}-${idx}`,
                                        url: URL.createObjectURL(file),
                                        file
                                      }))
                                      const updatedImages = [...(detail.images || []), ...newImages]
                                      const updated = (details.propertyDetails || []).map(d =>
                                        d.id === detail.id ? { ...d, images: updatedImages } : d
                                      )
                                      onDetailsChange({ propertyDetails: updated })
                                    }
                                    e.target.value = '' // Reset input
                                  }}
                                />
                                <label htmlFor={`detail-image-upload-${detail.id}`} className="cursor-pointer">
                                  <div className="flex items-center justify-center gap-2">
                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {(detail.images?.length || 0) === 0
                                        ? "Click to upload images"
                                        : "Add more images"}
                                    </span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor={`beds-${unitType}`} className="text-sm flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5" />
                    Bedrooms
                  </Label>
                  <Input
                    id={`beds-${unitType}`}
                    type="number"
                    min="0"
                    placeholder={String(defaultBedrooms)}
                    value={details.bedrooms ?? defaultBedrooms}
                    onChange={(e) => onDetailsChange({ bedrooms: e.target.value ? parseInt(e.target.value) : 0 })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`baths-${unitType}`} className="text-sm flex items-center gap-1.5">
                    <Bath className="h-3.5 w-3.5" />
                    Bathrooms
                  </Label>
                  <Input
                    id={`baths-${unitType}`}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={String(defaultBathrooms)}
                    value={details.bathrooms ?? defaultBathrooms}
                    onChange={(e) => onDetailsChange({ bathrooms: e.target.value ? parseFloat(e.target.value) : 0 })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`area-${unitType}`} className="text-sm flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5" />
                    Area (m²)
                  </Label>
                  <Input
                    id={`area-${unitType}`}
                    type="number"
                    min="0"
                    placeholder="e.g., 75"
                    value={details.area ?? 0}
                    onChange={(e) => onDetailsChange({ area: e.target.value ? parseFloat(e.target.value) : 0 })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`lease-${unitType}`} className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Min Lease
                  </Label>
                  <Select 
                    value={String(details.minLeaseTerm ?? 1)}
                    onValueChange={(v) => onDetailsChange({ minLeaseTerm: v ? parseInt(v) : 1 })}
                  >
                    <SelectTrigger id={`lease-${unitType}`}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6 mt-0">
              {/* Unit Features */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Unit Features
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select features available in this {unitTypeLabel} unit
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_FEATURES.map(feature => (
                    <label
                      key={feature}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                        ${details.features?.includes(feature) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'}`}
                    >
                      <Checkbox
                        checked={details.features?.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Building Amenities */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-3 block">
                  Building Amenities
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select amenities available in the building
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_AMENITIES.map(amenity => (
                    <label
                      key={amenity}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                        ${details.amenities?.includes(amenity) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'}`}
                    >
                      <Checkbox
                        checked={details.amenities?.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pet Policy */}
              <div className="pt-4 border-t">
                <Label htmlFor={`pets-${unitType}`} className="text-sm flex items-center gap-2 mb-2">
                  <PawPrint className="h-4 w-4" />
                  Pet Policy
                </Label>
                <Select 
                  value={details.petPolicy || ''}
                  onValueChange={(v) => onDetailsChange({ petPolicy: v })}
                >
                  <SelectTrigger id={`pets-${unitType}`}>
                    <SelectValue placeholder="Select pet policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allowed">Pets Allowed</SelectItem>
                    <SelectItem value="cats-only">Cats Only</SelectItem>
                    <SelectItem value="small-pets">Small Pets Only</SelectItem>
                    <SelectItem value="case-by-case">Case by Case</SelectItem>
                    <SelectItem value="not-allowed">No Pets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-0">
              {/* Sync Notice */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-700 font-medium">
                  Synced Pricing: Changing the price here will update all floors for this unit type
                </p>
              </div>

              {/* Monthly Rent */}
              <div className="grid gap-2">
                <Label htmlFor={`price-${unitType}`} className="text-sm font-medium">
                  Monthly Rent (UGX) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    UGX
                  </span>
                  <Input
                    id={`price-${unitType}`}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g., 2500000"
                    value={details.priceUgx ?? 0}
                    onChange={handlePriceChange}
                    className="pl-12"
                  />
                </div>
                {details.priceUgx && details.priceUgx > 0 && (
                  <p className="text-sm text-muted-foreground">
                    ≈ ${(details.priceUgx / 3700).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD{buildingType === 'hostel' ? '/semester' : '/month'}
                  </p>
                )}
              </div>

              {/* Included Utilities */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Included Utilities
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Select utilities included in the rent
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {UTILITIES_OPTIONS.map(utility => (
                    <label
                      key={utility}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                        ${details.utilities?.includes(utility) 
                          ? 'bg-green-500/10 border-green-500' 
                          : 'hover:bg-muted/50'}`}
                    >
                      <Checkbox
                        checked={details.utilities?.includes(utility)}
                        onCheckedChange={() => toggleUtility(utility)}
                      />
                      <span className="text-sm">{utility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="pt-4 border-t">
                <Label htmlFor={`available-${unitType}`} className="text-sm flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Available From
                </Label>
                <Input
                  id={`available-${unitType}`}
                  type="date"
                  value={details.availableFrom || ''}
                  onChange={(e) => onDetailsChange({ availableFrom: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank if available immediately
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}

export default UnitTypePropertyForm

