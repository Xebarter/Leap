'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Image as ImageIcon, Video, Upload, X, Loader2, Building2, AlertCircle, MapPin
} from 'lucide-react'
import { ApartmentFormData, ApartmentValidationErrors } from '../types'
import Image from 'next/image'

interface SimplifiedMediaSectionProps {
  formData: ApartmentFormData
  errors: ApartmentValidationErrors
  onUpdate: <K extends keyof ApartmentFormData>(name: K, value: ApartmentFormData[K]) => void
}

export function SimplifiedMediaSection({ 
  formData: apartmentFormData, 
  errors, 
  onUpdate 
}: SimplifiedMediaSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle building image upload
  const handleBuildingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Generate a unique file path
      const timestamp = Date.now()
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `buildings/${timestamp}_${fileName}`
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filePath', filePath)
      formData.append('bucket', 'property-images')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      if (data.url) {
        // Add to building image URLs array
        const currentUrls = apartmentFormData.buildingImageUrls || []
        onUpdate('buildingImageUrls', [...currentUrls, data.url])
        
        // Set as main image if none exists
        if (!apartmentFormData.buildingImageUrl) {
          onUpdate('buildingImageUrl', data.url)
        }
        
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError('Failed to upload image. Please try again.')
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // Remove building image
  const removeBuildingImage = (url: string) => {
    const currentUrls = apartmentFormData.buildingImageUrls || []
    const updatedUrls = currentUrls.filter(u => u !== url)
    onUpdate('buildingImageUrls', updatedUrls)
    
    // If removed image was the main one, set a new main image
    if (apartmentFormData.buildingImageUrl === url) {
      onUpdate('buildingImageUrl', updatedUrls[0] || '')
    }
    
    toast.success('Image removed')
  }

  // Set primary building image
  const setPrimaryBuildingImage = (url: string) => {
    onUpdate('buildingImageUrl', url)
    toast.success('Primary image updated')
  }

  const buildingImages = apartmentFormData.buildingImageUrls || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Building Media</h2>
        <p className="text-muted-foreground mt-1">
          Upload images and videos for the building exterior, common areas, and amenities. 
          Unit-specific images are managed in the <strong>Unit Types</strong> section.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 mb-1">Building-Level Media Only</p>
          <p className="text-blue-700">
            This section is for the building's exterior, entrance, lobby, amenities, and common areas. 
            For unit interiors (bedrooms, kitchens, bathrooms), go to the Unit Types section.
          </p>
        </div>
      </div>

      {/* Building Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Building Images
              </CardTitle>
              <CardDescription className="mt-1">
                Upload images of the building exterior, common areas, amenities, and facilities
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {buildingImages.length} image{buildingImages.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <div>
            <Label htmlFor="building-image-upload" className="cursor-pointer">
              <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors ${
                isUploading ? 'opacity-50 pointer-events-none' : ''
              }`}>
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload building images</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </Label>
            <Input
              id="building-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBuildingImageUpload}
              disabled={isUploading}
            />
          </div>

          {uploadError && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          {/* Image Gallery */}
          {buildingImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {buildingImages.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={url}
                      alt={`Building image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Primary Badge */}
                  {apartmentFormData.buildingImageUrl === url && (
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                      Primary
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {apartmentFormData.buildingImageUrl !== url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPrimaryBuildingImage(url)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeBuildingImage(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {buildingImages.length === 0 && !isUploading && (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No building images uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Building Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Building Video/Virtual Tour
          </CardTitle>
          <CardDescription>
            Add a YouTube or video URL for a building tour or promotional video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="building-video">Video URL</Label>
            <Input
              id="building-video"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={apartmentFormData.buildingVideoUrl || ''}
              onChange={(e) => onUpdate('buildingVideoUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Supports YouTube, Vimeo, or direct video links
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Google Maps Embed
          </CardTitle>
          <CardDescription>
            Add a Google Maps embed URL to show the building location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="google-maps">Google Maps Embed URL</Label>
            <Input
              id="google-maps"
              type="url"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={apartmentFormData.googleMapsEmbedUrl || ''}
              onChange={(e) => onUpdate('googleMapsEmbedUrl', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get the embed URL from Google Maps: Share → Embed a map → Copy HTML (extract the src URL)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
