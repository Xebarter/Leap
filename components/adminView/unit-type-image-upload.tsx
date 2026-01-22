'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ImageIcon, Upload, X, Loader2, Star, StarOff, GripVertical, Plus
} from 'lucide-react'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

// Image categories that match the database schema
export const IMAGE_CATEGORIES = [
  { value: 'Interior', label: 'Interior (General)' },
  { value: 'Living Room', label: 'Living Room' },
  { value: 'Bedroom', label: 'Bedroom' },
  { value: 'Bathroom', label: 'Bathroom' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Dining Room', label: 'Dining Room' },
  { value: 'Balcony', label: 'Balcony' },
  { value: 'Terrace', label: 'Terrace' },
  { value: 'Entrance', label: 'Entrance' },
  { value: 'Exterior', label: 'Exterior' },
  { value: 'Other', label: 'Other' },
]

// Single image in a unit type gallery
export interface UnitTypeImage {
  id: string
  url: string
  category: string
  isPrimary: boolean
  displayOrder: number
  isUploading?: boolean
}

interface UnitTypeImageUploadProps {
  unitType: string
  unitTypeLabel: string
  unitTypeColor: string
  images: UnitTypeImage[]
  onImagesChange: (images: UnitTypeImage[]) => void
  maxImages?: number
}

// Generate unique ID for images
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function UnitTypeImageUpload({
  unitType,
  unitTypeLabel,
  unitTypeColor,
  images,
  onImagesChange,
  maxImages = 10
}: UnitTypeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({})

  // Upload a single file
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Generate unique file path
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `unit-types/${unitType}/${timestamp}-${sanitizedName}`
      formData.append('filePath', filePath)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      return data.url || null
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }

  // Handle multiple file selection
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed per unit type`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setIsUploading(true)

    // Create placeholder entries for uploading images
    const newImages: UnitTypeImage[] = filesToUpload.map((file, index) => ({
      id: generateImageId(),
      url: URL.createObjectURL(file), // Temporary preview URL
      category: 'Interior',
      isPrimary: images.length === 0 && index === 0, // First image is primary if no images exist
      displayOrder: images.length + index,
      isUploading: true
    }))

    // Add placeholders to show upload progress
    onImagesChange([...images, ...newImages])

    // Upload files concurrently
    const uploadPromises = filesToUpload.map(async (file, index) => {
      const uploadedUrl = await uploadFile(file)
      return { index, url: uploadedUrl }
    })

    const results = await Promise.all(uploadPromises)

    // Update images with actual URLs
    const updatedImages = [...images]
    results.forEach(({ index, url }) => {
      if (url) {
        updatedImages.push({
          ...newImages[index],
          url,
          isUploading: false
        })
      }
    })

    // Remove any failed uploads and update
    const successfulImages = updatedImages.filter(img => !img.isUploading || img.url.startsWith('http'))
    onImagesChange(successfulImages)
    setIsUploading(false)
  }

  // Remove an image
  const removeImage = (imageId: string) => {
    const filtered = images.filter(img => img.id !== imageId)
    // If we removed the primary image, make the first remaining one primary
    if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
      filtered[0].isPrimary = true
    }
    // Re-order display order
    filtered.forEach((img, idx) => {
      img.displayOrder = idx
    })
    onImagesChange(filtered)
  }

  // Set an image as primary
  const setPrimaryImage = (imageId: string) => {
    const updated = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    onImagesChange(updated)
  }

  // Update image category
  const updateImageCategory = (imageId: string, category: string) => {
    const updated = images.map(img => 
      img.id === imageId ? { ...img, category } : img
    )
    onImagesChange(updated)
  }

  // Move image in order
  const moveImage = (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= images.length) return

    const newImages = [...images]
    const temp = newImages[currentIndex]
    newImages[currentIndex] = newImages[newIndex]
    newImages[newIndex] = temp

    // Update display orders
    newImages.forEach((img, idx) => {
      img.displayOrder = idx
    })

    onImagesChange(newImages)
  }

  const hasImages = images.length > 0
  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Header with unit type info and upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            Images for {unitTypeLabel}
          </Label>
          <Badge variant="outline" className="text-xs">
            {images.length}/{maxImages}
          </Badge>
        </div>
        
        {canAddMore && (
          <label className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isUploading}
              asChild
            >
              <span>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Images
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              disabled={isUploading}
              onChange={(e) => {
                handleFilesSelected(e.target.files)
                e.target.value = '' // Reset input
              }}
            />
          </label>
        )}
      </div>

      {/* Empty state */}
      {!hasImages && (
        <label className="cursor-pointer">
          <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <div className={`w-12 h-12 rounded-full ${unitTypeColor} flex items-center justify-center`}>
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload images for {unitTypeLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add photos of living room, bedroom, kitchen, bathroom, etc.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB each • Max {maxImages} images
                </p>
              </div>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFilesSelected(e.target.files)
              e.target.value = '' // Reset input
            }}
          />
        </label>
      )}

      {/* Image Grid */}
      {hasImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <Card 
              key={image.id} 
              className={`relative overflow-hidden group ${image.isPrimary ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-muted">
                  {image.isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={image.url}
                      alt={`${unitTypeLabel} - ${image.category}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Primary badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        Main
                      </Badge>
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <TooltipProvider>
                      {!image.isPrimary && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPrimaryImage(image.id)}
                            >
                              <StarOff className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Set as main image</TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Category selector */}
                <div className="p-2 border-t">
                  <Select
                    value={image.category || 'Interior'}
                    onValueChange={(value) => updateImageCategory(image.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value} className="text-xs">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add more button as a card */}
          {canAddMore && (
            <label className="cursor-pointer">
              <Card className="h-full min-h-[140px] border-dashed hover:bg-muted/50 transition-colors">
                <CardContent className="h-full p-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Plus className="h-8 w-8" />
                    <span className="text-xs">Add more</span>
                  </div>
                </CardContent>
              </Card>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => {
                  handleFilesSelected(e.target.files)
                  e.target.value = '' // Reset input
                }}
              />
            </label>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        💡 Tip: The main image will be shown as the listing thumbnail. Add images for each room to showcase this unit type.
      </p>
    </div>
  )
}

export default UnitTypeImageUpload
