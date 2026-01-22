'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Image as ImageIcon, Video, Upload, X, Loader2, Building2, Home, Info, Check,
  ChefHat, Bed, Bath, Sofa, Sun, Car, Utensils, Grid3X3
} from 'lucide-react'
import { ApartmentFormData, UNIT_TYPE_COLORS, getUnitTypeLabel, getUniqueUnitTypes } from '../types'
import { UnitTypeDetails, UnitTypeImage } from '../../floor-unit-type-configurator'

// Image categories with icons and colors
export const IMAGE_CATEGORIES = [
  { value: 'General', label: 'General', icon: Grid3X3, color: 'bg-gray-100 text-gray-700' },
  { value: 'Kitchen', label: 'Kitchen', icon: ChefHat, color: 'bg-orange-100 text-orange-700' },
  { value: 'Bedroom', label: 'Bedroom', icon: Bed, color: 'bg-blue-100 text-blue-700' },
  { value: 'Bathroom', label: 'Bathroom', icon: Bath, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Living Room', label: 'Living Room', icon: Sofa, color: 'bg-green-100 text-green-700' },
  { value: 'Balcony', label: 'Balcony/Terrace', icon: Sun, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Dining', label: 'Dining Area', icon: Utensils, color: 'bg-amber-100 text-amber-700' },
  { value: 'Parking', label: 'Parking', icon: Car, color: 'bg-slate-100 text-slate-700' },
]

function getCategoryInfo(category: string) {
  return IMAGE_CATEGORIES.find(c => c.value === category) || IMAGE_CATEGORIES[0]
}

interface MediaSectionProps {
  formData: ApartmentFormData
  uniqueUnitTypes: string[]
  onUpdate: <K extends keyof ApartmentFormData>(name: K, value: ApartmentFormData[K]) => void
  onUpdateUnitTypeDetails: (type: string, details: Partial<UnitTypeDetails>) => void
}

export function MediaSection({ formData, uniqueUnitTypes, onUpdate, onUpdateUnitTypeDetails }: MediaSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('building')
  const [uploadingUnitType, setUploadingUnitType] = useState<string | null>(null)
  // Track selected category for upload per unit type
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({})
  // Track category filter per unit type for display
  const [categoryFilters, setCategoryFilters] = useState<Record<string, string>>({})

  // Get selected upload category for a unit type
  const getSelectedCategory = (type: string) => selectedCategories[type] || 'General'
  
  // Set selected upload category for a unit type
  const setSelectedCategory = (type: string, category: string) => {
    setSelectedCategories(prev => ({ ...prev, [type]: category }))
  }

  // Get category filter for display
  const getCategoryFilter = (type: string) => categoryFilters[type] || 'all'
  
  // Set category filter for display
  const setCategoryFilter = (type: string, category: string) => {
    setCategoryFilters(prev => ({ ...prev, [type]: category }))
  }

  // Get unit type details helper
  const getUnitTypeDetails = (type: string): UnitTypeDetails | undefined => {
    return formData.unitTypeDetails.find(d => d.type === type)
  }

  // Get all images for a unit type
  const getUnitTypeImages = (type: string): UnitTypeImage[] => {
    const details = getUnitTypeDetails(type)
    if (details?.images && details.images.length > 0) {
      return details.images
    }
    if (details?.imageUrl) {
      return [{
        id: 'legacy_0',
        url: details.imageUrl,
        category: 'General',
        isPrimary: true,
        displayOrder: 0
      }]
    }
    return []
  }

  // Get images filtered by category
  const getFilteredImages = (type: string): UnitTypeImage[] => {
    const allImages = getUnitTypeImages(type)
    const filter = getCategoryFilter(type)
    if (filter === 'all') return allImages
    return allImages.filter(img => img.category === filter)
  }

  // Get image count by category for a unit type
  const getImageCountsByCategory = (type: string): Record<string, number> => {
    const images = getUnitTypeImages(type)
    const counts: Record<string, number> = { all: images.length }
    images.forEach(img => {
      counts[img.category] = (counts[img.category] || 0) + 1
    })
    return counts
  }

  // Handle unit type image upload with category
  const handleUnitTypeImageUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const category = getSelectedCategory(type)
    setUploadingUnitType(type)
    setUploadError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `unit_${type}_${category}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `units/${fileName}`

        // Upload via API route (uses service role to bypass RLS)
        const formDataToSend = new FormData()
        formDataToSend.append('file', file)
        formDataToSend.append('filePath', filePath)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataToSend
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()
        uploadedUrls.push(result.url)
      }

      // Update unit type details with new images including category
      const currentDetails = getUnitTypeDetails(type)
      const currentImages = currentDetails?.images || []
      const newImages: UnitTypeImage[] = [
        ...currentImages,
        ...uploadedUrls.map((url, idx) => ({
          id: `img_${Date.now()}_${idx}`,
          url,
          category,
          isPrimary: currentImages.length === 0 && idx === 0,
          displayOrder: currentImages.length + idx
        }))
      ]

      onUpdateUnitTypeDetails(type, {
        images: newImages,
        imageUrl: newImages.find(img => img.isPrimary)?.url || newImages[0]?.url || currentDetails?.imageUrl
      })
      
      toast.success(`Successfully uploaded ${uploadedUrls.length} ${category} image(s) for ${getUnitTypeLabel(type)}`)
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Failed to upload image'
      setUploadError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploadingUnitType(null)
    }
  }

  // Remove unit type image
  const removeUnitTypeImage = (type: string, imageId: string) => {
    const currentDetails = getUnitTypeDetails(type)
    const currentImages = currentDetails?.images || []
    const removedImage = currentImages.find(img => img.id === imageId)
    const newImages = currentImages.filter(img => img.id !== imageId)
    
    // Update primary if removed
    if (newImages.length > 0 && removedImage?.isPrimary) {
      newImages[0].isPrimary = true
    }

    onUpdateUnitTypeDetails(type, {
      images: newImages,
      imageUrl: newImages.find(img => img.isPrimary)?.url || newImages[0]?.url || ''
    })
  }

  // Set unit type primary image
  const setUnitTypePrimaryImage = (type: string, imageId: string) => {
    const currentDetails = getUnitTypeDetails(type)
    const currentImages = currentDetails?.images || []
    const newImages = currentImages.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    const primaryImage = newImages.find(img => img.isPrimary)

    onUpdateUnitTypeDetails(type, {
      images: newImages,
      imageUrl: primaryImage?.url || ''
    })
  }

  // Update image category
  const updateImageCategory = (type: string, imageId: string, newCategory: string) => {
    const currentDetails = getUnitTypeDetails(type)
    const currentImages = currentDetails?.images || []
    const newImages = currentImages.map(img => 
      img.id === imageId ? { ...img, category: newCategory } : img
    )

    onUpdateUnitTypeDetails(type, {
      images: newImages
    })
  }

  // Handle building image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`)
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `building_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `buildings/${fileName}`

        // Upload via API route (uses service role to bypass RLS)
        const formDataToSend = new FormData()
        formDataToSend.append('file', file)
        formDataToSend.append('filePath', filePath)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataToSend
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()
        uploadedUrls.push(result.url)
      }

      // Update form data
      const currentImages = formData.buildingImageUrls || []
      const newImages = [...currentImages, ...uploadedUrls]
      onUpdate('buildingImageUrls', newImages)

      // Set first image as main if not set
      if (!formData.buildingImageUrl && newImages.length > 0) {
        onUpdate('buildingImageUrl', newImages[0])
      }
      
      toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`)
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Failed to upload image'
      setUploadError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  // Remove image
  const removeImage = (url: string) => {
    const currentImages = formData.buildingImageUrls || []
    const newImages = currentImages.filter(u => u !== url)
    onUpdate('buildingImageUrls', newImages)

    // Update main image if it was removed
    if (formData.buildingImageUrl === url) {
      onUpdate('buildingImageUrl', newImages[0] || '')
    }
  }

  // Set image as main
  const setAsMainImage = (url: string) => {
    onUpdate('buildingImageUrl', url)
  }

  const allBuildingImages = formData.buildingImageUrls || []

  // Count total unit type images
  const totalUnitTypeImages = uniqueUnitTypes.reduce((sum, type) => sum + getUnitTypeImages(type).length, 0)
  
  // Get category breakdown across all unit types
  const getTotalCategoryBreakdown = (): Record<string, number> => {
    const totals: Record<string, number> = {}
    uniqueUnitTypes.forEach(type => {
      const images = getUnitTypeImages(type)
      images.forEach(img => {
        totals[img.category] = (totals[img.category] || 0) + 1
      })
    })
    return totals
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Media</h2>
        <p className="text-muted-foreground mt-1">
          Upload photos and videos for the building and each unit type
        </p>
      </div>

      {/* Sync Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-800">Synced with Floors & Units</p>
          <p className="text-blue-700 mt-1">
            Unit type images uploaded here are synced with the "Floors & Units" configuration.
            Changes made in either section will be reflected in both places.
          </p>
        </div>
      </div>

      {/* Media Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('building')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Building Photos</p>
                <p className="text-2xl font-bold">{allBuildingImages.length}</p>
              </div>
              {allBuildingImages.length > 0 && (
                <Check className="h-5 w-5 text-green-600 ml-auto" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('units')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Type Photos</p>
                <p className="text-2xl font-bold">{totalUnitTypeImages}</p>
              </div>
              {totalUnitTypeImages > 0 && (
                <Check className="h-5 w-5 text-green-600 ml-auto" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="building" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Building
            {allBuildingImages.length > 0 && (
              <Badge variant="secondary" className="ml-1">{allBuildingImages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Unit Types
            {totalUnitTypeImages > 0 && (
              <Badge variant="secondary" className="ml-1">{totalUnitTypeImages}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
            {formData.buildingVideoUrl && (
              <Check className="h-4 w-4 ml-1 text-green-600" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Building Images Tab */}
        <TabsContent value="building" className="mt-4">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Building Photos
          </CardTitle>
          <CardDescription>
            Upload photos of the building exterior, lobby, amenities, and common areas. 
            These will be shown alongside all unit type listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="building-images"
              disabled={isUploading}
            />
            <label
              htmlFor="building-images"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB each
                  </p>
                </>
              )}
            </label>
          </div>

          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}

          {/* Image Grid */}
          {allBuildingImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allBuildingImages.map((url, index) => (
                <div 
                  key={url} 
                  className={`relative group aspect-video rounded-lg overflow-hidden border-2 ${
                    url === formData.buildingImageUrl ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Building image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {url !== formData.buildingImageUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setAsMainImage(url)}
                      >
                        Set as Main
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Main Badge */}
                  {url === formData.buildingImageUrl && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Unit Types Images Tab */}
        <TabsContent value="units" className="mt-4 space-y-4">
          {uniqueUnitTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Unit Types Configured</h3>
                  <p className="text-sm">
                    Go to the "Floors & Units" section to add unit types to your building first.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            uniqueUnitTypes.map(type => {
              const colors = UNIT_TYPE_COLORS[type] || UNIT_TYPE_COLORS['1BR']
              const allImages = getUnitTypeImages(type)
              const filteredImages = getFilteredImages(type)
              const imageCounts = getImageCountsByCategory(type)
              const isUploadingThis = uploadingUnitType === type
              const selectedCategory = getSelectedCategory(type)
              const currentFilter = getCategoryFilter(type)

              return (
                <Card key={type} className={`border-2 ${colors.border}`}>
                  <CardHeader className={colors.bg}>
                    <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
                      <Home className="h-5 w-5" />
                      {getUnitTypeLabel(type)} Photos
                      {allImages.length > 0 && (
                        <Badge variant="secondary" className="ml-auto bg-white">
                          {allImages.length} image{allImages.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Upload interior photos organized by room type for {getUnitTypeLabel(type).toLowerCase()} units
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Upload Area with Category Selection */}
                    <div className="border-2 border-dashed rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Category Selector */}
                        <div className="w-full sm:w-48">
                          <Label className="text-xs text-muted-foreground mb-1 block">Upload to category:</Label>
                          <Select 
                            value={selectedCategory} 
                            onValueChange={(val) => setSelectedCategory(type, val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_CATEGORIES.map(cat => {
                                const Icon = cat.icon
                                return (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {cat.label}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleUnitTypeImageUpload(type, e)}
                            className="hidden"
                            id={`unit-images-${type}`}
                            disabled={isUploadingThis}
                          />
                          <label
                            htmlFor={`unit-images-${type}`}
                            className="cursor-pointer inline-flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            {isUploadingThis ? (
                              <>
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                <p className="text-sm text-muted-foreground">Uploading to {selectedCategory}...</p>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload <span className="font-medium">{getCategoryInfo(selectedCategory).label}</span> photos
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Category Filter Tabs */}
                    {allImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={currentFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoryFilter(type, 'all')}
                          className="h-8"
                        >
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          All ({imageCounts.all || 0})
                        </Button>
                        {IMAGE_CATEGORIES.filter(cat => imageCounts[cat.value]).map(cat => {
                          const Icon = cat.icon
                          const count = imageCounts[cat.value] || 0
                          if (count === 0) return null
                          return (
                            <Button
                              key={cat.value}
                              variant={currentFilter === cat.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCategoryFilter(type, cat.value)}
                              className="h-8"
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {cat.label} ({count})
                            </Button>
                          )
                        })}
                      </div>
                    )}

                    {/* Image Grid */}
                    {filteredImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredImages.map((image, index) => {
                          const categoryInfo = getCategoryInfo(image.category)
                          const CategoryIcon = categoryInfo.icon
                          
                          return (
                            <div 
                              key={image.id} 
                              className={`relative group aspect-video rounded-lg overflow-hidden border-2 ${
                                image.isPrimary ? 'border-primary' : 'border-transparent'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt={`${getUnitTypeLabel(type)} ${image.category} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Category Badge */}
                              <div className={`absolute bottom-1 left-1 text-xs px-2 py-0.5 rounded flex items-center gap-1 ${categoryInfo.color}`}>
                                <CategoryIcon className="h-3 w-3" />
                                {image.category}
                              </div>

                              {/* Main Badge */}
                              {image.isPrimary && (
                                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                                  Main
                                </div>
                              )}
                              
                              {/* Overlay with Actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                {/* Category Changer */}
                                <Select 
                                  value={image.category} 
                                  onValueChange={(val) => updateImageCategory(type, image.id, val)}
                                >
                                  <SelectTrigger className="w-full h-7 text-xs bg-white/90">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {IMAGE_CATEGORIES.map(cat => {
                                      const Icon = cat.icon
                                      return (
                                        <SelectItem key={cat.value} value={cat.value}>
                                          <div className="flex items-center gap-2">
                                            <Icon className="h-3 w-3" />
                                            {cat.label}
                                          </div>
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>

                                <div className="flex gap-1">
                                  {!image.isPrimary && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setUnitTypePrimaryImage(type, image.id)}
                                      className="h-7 text-xs"
                                    >
                                      Set Main
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeUnitTypeImage(type, image.id)}
                                    className="h-7"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : allImages.length > 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No images in this category</p>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={() => setCategoryFilter(type, 'all')}
                        >
                          View all images
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Building Video Tour
              </CardTitle>
              <CardDescription>
                Add a video tour of the building (YouTube or Vimeo link)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.buildingVideoUrl || ''}
                  onChange={(e) => onUpdate('buildingVideoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube or Vimeo video URL for a virtual tour
                </p>
              </div>

              {/* Video Preview */}
              {formData.buildingVideoUrl && (
                <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-muted">
                  {formData.buildingVideoUrl.includes('youtube') ? (
                    <iframe
                      src={formData.buildingVideoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : formData.buildingVideoUrl.includes('vimeo') ? (
                    <iframe
                      src={formData.buildingVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Video preview not available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
