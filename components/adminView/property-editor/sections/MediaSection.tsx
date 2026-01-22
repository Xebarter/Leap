'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { PropertyFormData } from '../types'
import { 
  Upload, X, Image as ImageIcon, Video, Star, Loader2, 
  Plus, Trash2, Home, ChevronRight, AlertCircle, Pencil, ImagePlus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Predefined property detail types
const DETAIL_TYPES = [
  "Bedroom", "Bathroom", "Kitchen", "Living Room", "Dining Room",
  "Balcony", "Garden", "Pool", "Garage", "Office", "Gym",
  "Laundry Room", "Storage", "Terrace", "Other"
]

interface PropertyDetailImage {
  id: string
  image_url: string
  display_order: number
}

interface PropertyDetail {
  id: string
  detail_name: string
  detail_type: string
  description?: string
  images: PropertyDetailImage[]
}

interface MediaSectionProps {
  formData: PropertyFormData
  propertyId?: string
  onUpdate: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void
}

export function MediaSection({ formData, propertyId, onUpdate }: MediaSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingMain, setIsUploadingMain] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  
  // Property details state
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetail[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [isAddDetailDialogOpen, setIsAddDetailDialogOpen] = useState(false)
  const [newDetailName, setNewDetailName] = useState('')
  const [newDetailType, setNewDetailType] = useState('')
  const [newDetailDescription, setNewDetailDescription] = useState('')
  const [uploadingDetailId, setUploadingDetailId] = useState<string | null>(null)

  // Load property details when propertyId is available
  useEffect(() => {
    if (propertyId) {
      loadPropertyDetails()
    }
  }, [propertyId])

  const loadPropertyDetails = async () => {
    if (!propertyId) return
    
    setDetailsLoading(true)
    try {
      const supabase = createClient()
      
      const { data: detailsData, error: detailsError } = await supabase
        .from('property_details')
        .select('*')
        .eq('property_id', propertyId)
      
      if (detailsError) throw detailsError

      // Fetch images for each detail
      const detailsWithImages: PropertyDetail[] = []
      
      for (const detail of detailsData || []) {
        const { data: imagesData } = await supabase
          .from('property_detail_images')
          .select('*')
          .eq('property_detail_id', detail.id)
          .order('display_order', { ascending: true })
        
        detailsWithImages.push({
          ...detail,
          images: imagesData || []
        })
      }

      setPropertyDetails(detailsWithImages)
    } catch (error) {
      console.error('Error loading property details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  // Main image upload handler
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files are allowed')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          setUploadError('File size must be less than 5MB')
          continue
        }

        const ext = file.name.split('.').pop()
        const filename = `property-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = `property-images/${propertyId || 'temp'}/${filename}`

        // Upload via API route
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('filePath', filePath)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        const result = await response.json()

        if (response.ok && !result.error) {
          newUrls.push(result.url)
        } else {
          console.error('Upload error:', result.error)
          setUploadError('Failed to upload image')
        }
      }

      if (newUrls.length > 0) {
        const updatedUrls = [...(formData.image_urls || []), ...newUrls]
        onUpdate('image_urls', updatedUrls)
        
        if (!formData.image_url && updatedUrls.length > 0) {
          onUpdate('image_url', updatedUrls[0])
        }
        toast.success(`${newUrls.length} image(s) uploaded`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }, [formData.image_url, formData.image_urls, onUpdate, propertyId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragActive(false)
  }, [])

  const removeImage = useCallback((urlToRemove: string) => {
    const updatedUrls = (formData.image_urls || []).filter(url => url !== urlToRemove)
    onUpdate('image_urls', updatedUrls)
    
    if (formData.image_url === urlToRemove) {
      onUpdate('image_url', updatedUrls[0] || '')
    }
    toast.success('Image removed')
  }, [formData.image_url, formData.image_urls, onUpdate])

  const setAsMain = useCallback((url: string) => {
    onUpdate('image_url', url)
    toast.success('Main image updated')
  }, [onUpdate])

  // Upload/replace main image handler
  const handleMainImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploadingMain(true)
    setUploadError(null)

    try {
      const file = files[0] // Only take the first file for main image
      
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed')
        setIsUploadingMain(false)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB')
        setIsUploadingMain(false)
        return
      }

      const ext = file.name.split('.').pop()
      const filename = `property-main-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const filePath = `property-images/${propertyId || 'temp'}/${filename}`

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('filePath', filePath)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (response.ok && !result.error) {
        // Set as main image
        onUpdate('image_url', result.url)
        // Also add to image_urls if not already there
        const currentUrls = formData.image_urls || []
        if (!currentUrls.includes(result.url)) {
          onUpdate('image_urls', [result.url, ...currentUrls])
        }
        toast.success('Main image updated')
      } else {
        console.error('Upload error:', result.error)
        setUploadError('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Failed to upload image')
    } finally {
      setIsUploadingMain(false)
    }
  }, [formData.image_urls, onUpdate, propertyId])

  // Property Details handlers
  const handleAddDetail = async () => {
    if (!newDetailName || !newDetailType) {
      toast.error('Please fill in all required fields')
      return
    }

    const newDetail: PropertyDetail = {
      id: `temp-${Date.now()}`,
      detail_name: newDetailName,
      detail_type: newDetailType,
      description: newDetailDescription,
      images: []
    }

    if (propertyId) {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('property_details')
          .insert({
            property_id: propertyId,
            detail_name: newDetailName,
            detail_type: newDetailType,
            description: newDetailDescription
          })
          .select()
          .single()

        if (error) throw error
        newDetail.id = data.id
        toast.success('Property detail added')
      } catch (error) {
        console.error('Error creating property detail:', error)
        toast.error('Failed to add property detail')
        return
      }
    }

    setPropertyDetails(prev => [...prev, newDetail])
    setNewDetailName('')
    setNewDetailType('')
    setNewDetailDescription('')
    setIsAddDetailDialogOpen(false)
  }

  const handleDeleteDetail = async (detailId: string) => {
    if (!confirm('Are you sure you want to delete this detail and all its images?')) return

    if (propertyId && !detailId.startsWith('temp-')) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('property_details')
          .delete()
          .eq('id', detailId)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting property detail:', error)
        toast.error('Failed to delete property detail')
        return
      }
    }

    setPropertyDetails(prev => prev.filter(d => d.id !== detailId))
    toast.success('Property detail deleted')
  }

  const handleDetailImageUpload = async (detailId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingDetailId(detailId)

    try {
      const newImages: PropertyDetailImage[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > 5 * 1024 * 1024) continue

        const ext = file.name.split('.').pop()
        const filename = `detail-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const filePath = `property-images/${propertyId || 'temp'}/details/${filename}`

        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('filePath', filePath)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        const result = await response.json()

        if (response.ok && !result.error) {
          const newImage: PropertyDetailImage = {
            id: `temp-${Date.now()}-${Math.random()}`,
            image_url: result.url,
            display_order: 0
          }

          // Save to database if we have a real detail ID
          if (propertyId && !detailId.startsWith('temp-')) {
            const supabase = createClient()
            const { data, error } = await supabase
              .from('property_detail_images')
              .insert({
                property_detail_id: detailId,
                image_url: result.url,
                display_order: 0
              })
              .select()
              .single()

            if (!error && data) {
              newImage.id = data.id
            }
          }

          newImages.push(newImage)
        }
      }

      if (newImages.length > 0) {
        setPropertyDetails(prev => prev.map(d => 
          d.id === detailId 
            ? { ...d, images: [...d.images, ...newImages] }
            : d
        ))
        toast.success(`${newImages.length} image(s) added to ${propertyDetails.find(d => d.id === detailId)?.detail_name}`)
      }
    } catch (error) {
      console.error('Error uploading detail image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingDetailId(null)
    }
  }

  const handleDeleteDetailImage = async (detailId: string, imageId: string) => {
    if (propertyId && !imageId.startsWith('temp-')) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('property_detail_images')
          .delete()
          .eq('id', imageId)

        if (error) throw error
      } catch (error) {
        console.error('Error deleting detail image:', error)
        toast.error('Failed to delete image')
        return
      }
    }

    setPropertyDetails(prev => prev.map(d => 
      d.id === detailId 
        ? { ...d, images: d.images.filter(img => img.id !== imageId) }
        : d
    ))
    toast.success('Image deleted')
  }

  // Get additional gallery images (excluding main image)
  const galleryImages = (formData.image_urls || []).filter(url => url !== formData.image_url)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Media</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your property's main image, gallery photos, and videos.
        </p>
      </div>

      {/* Main Property Image Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Main Property Image
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                This image appears in search results and as the cover photo
              </p>
            </div>
          </div>

          {formData.image_url ? (
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative aspect-video max-w-2xl rounded-lg overflow-hidden border bg-muted">
                <img
                  src={formData.image_url}
                  alt="Main property image"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                      Main Image
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => mainImageInputRef.current?.click()}
                        disabled={isUploadingMain}
                      >
                        {isUploadingMain ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Pencil className="h-4 w-4 mr-1" />
                        )}
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          onUpdate('image_url', galleryImages[0] || '')
                          removeImage(formData.image_url)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleMainImageUpload(e.target.files)}
                className="hidden"
              />
            </div>
          ) : (
            /* No main image - Upload prompt */
            <div
              onClick={() => mainImageInputRef.current?.click()}
              className={`
                relative aspect-video max-w-2xl rounded-lg border-2 border-dashed 
                flex flex-col items-center justify-center cursor-pointer transition-colors
                ${isUploadingMain ? 'opacity-50 pointer-events-none' : 'hover:border-primary hover:bg-primary/5'}
                border-muted-foreground/25
              `}
            >
              {isUploadingMain ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-full mb-3">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Upload Main Image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to select or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </>
              )}
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleMainImageUpload(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Gallery Images Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Gallery Images</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Additional images to showcase different areas of the property
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Images
          </Button>
          <input
            ref={galleryInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Gallery Grid */}
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryImages.map((url, index) => (
              <div
                key={url}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setAsMain(url)}
                    title="Set as main image"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(url)}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => galleryInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop images here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB each
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {uploadError}
          </div>
        )}

        {/* Video URL */}
        <div className="space-y-2">
          <Label htmlFor="video" className="text-sm font-medium flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video URL (Optional)
          </Label>
          <Input
            id="video"
            value={formData.video_url || ''}
            onChange={(e) => onUpdate('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-muted-foreground">
            Add a YouTube or TikTok video URL to showcase your property
          </p>
        </div>
      </div>

      <Separator />

      {/* Property Details Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Details
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Add room-by-room details with images (bedrooms, bathrooms, kitchen, etc.)
            </p>
          </div>
          <Button onClick={() => setIsAddDetailDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Detail
          </Button>
        </div>

        {!propertyId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-medium">Save the property first</p>
            <p className="text-amber-700 mt-1">
              Property details can be added after saving the basic property information.
            </p>
          </div>
        )}

        {detailsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : propertyDetails.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {propertyDetails.map((detail) => (
              <AccordionItem 
                key={detail.id} 
                value={detail.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="secondary">{detail.detail_type}</Badge>
                    <span className="font-medium">{detail.detail_name}</span>
                    {detail.images.length > 0 && (
                      <Badge variant="outline" className="ml-auto mr-2">
                        {detail.images.length} image{detail.images.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {detail.description && (
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                    )}
                    
                    {/* Detail Images */}
                    {detail.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {detail.images.map((img) => (
                          <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border">
                            <img
                              src={img.image_url}
                              alt={`${detail.detail_name}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteDetailImage(detail.id, img.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload more images */}
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={`detail-upload-${detail.id}`}
                        className="cursor-pointer"
                      >
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          disabled={uploadingDetailId === detail.id}
                          asChild
                        >
                          <span>
                            {uploadingDetailId === detail.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Add Images
                          </span>
                        </Button>
                      </Label>
                      <input
                        id={`detail-upload-${detail.id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleDetailImageUpload(detail.id, e.target.files)}
                        disabled={uploadingDetailId === detail.id}
                      />
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive ml-auto"
                        onClick={() => handleDeleteDetail(detail.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Detail
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : propertyId ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No property details added yet</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => setIsAddDetailDialogOpen(true)}
            >
              Add your first detail <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* Add Detail Dialog */}
      <Dialog open={isAddDetailDialogOpen} onOpenChange={setIsAddDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property Detail</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="detailType">Type *</Label>
              <Select value={newDetailType} onValueChange={setNewDetailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DETAIL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="detailName">Name *</Label>
              <Input
                id="detailName"
                value={newDetailName}
                onChange={(e) => setNewDetailName(e.target.value)}
                placeholder="e.g., Master Bedroom, Guest Bathroom"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="detailDescription">Description (optional)</Label>
              <Textarea
                id="detailDescription"
                value={newDetailDescription}
                onChange={(e) => setNewDetailDescription(e.target.value)}
                placeholder="Describe this area..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDetailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDetail} disabled={!newDetailName || !newDetailType}>
              Add Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
