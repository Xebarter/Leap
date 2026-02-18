'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  MapPin,
  BedDouble,
  Waves as WavesIcon,
  Square,
  Car,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Check,
  Star,
  Phone,
  Shield,
  Eye,
  ThumbsUp,
  Dumbbell,
  Waves,
  Home,
  Calendar,
  MapPinned,
  Building2,
  Trees,
  FileText,
  Wifi,
  AirVent,
  ShowerHead,
  Tv,
  Award,
  Users,
  Mail,
  Sparkles,
  Play,
  X,
  ImageIcon,
  Maximize2,
  Plus,
  Hash,
  Copy,
  ChevronDown,
  ChevronUp,
  Download,
  PrinterIcon,
  ExternalLink,
  ArrowRight,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { PropertyVideoPlayer } from '@/components/publicView/property-video-player'
import { BuildingBlockVisualization, Unit } from '@/components/publicView/building-block-visualization'
import { PropertyData, PropertyDetail, PropertyImage } from '@/lib/properties'
import { generateUnitNumber, formatUnitNumber } from '@/lib/unit-number-generator'
import { ScheduleVisitDialog } from '@/components/publicView/schedule-visit-dialog'
import { ReservePropertyDialog } from '@/components/publicView/reserve-property-dialog'
import { ApplyNowDialog } from '@/components/publicView/apply-now-dialog'
import { UnitActionDialog } from '@/components/publicView/unit-action-dialog'
import { MobileMoneyPaymentDialog } from '@/components/publicView/mobile-money-payment-dialog'
import { PesapalPaymentDialog } from '@/components/publicView/pesapal-payment-dialog'
import { toast } from '@/hooks/use-toast'

interface PropertyDetailsContentProps {
  property: PropertyData
  id: string
}

export default function PropertyDetailsContent({ property, id }: PropertyDetailsContentProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = React.useState(false)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxImages, setLightboxImages] = React.useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = React.useState(0)
  const [copiedId, setCopiedId] = React.useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false)
  const [shareMenuOpen, setShareMenuOpen] = React.useState(false)
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null)
  const [unitActionDialogOpen, setUnitActionDialogOpen] = React.useState(false)
  const [viewCounts, setViewCounts] = React.useState({ dailyViews: 0, totalViews: 0, interested: 0 })
  const [hasExpressedInterest, setHasExpressedInterest] = React.useState(false)
  const [isExpressingInterest, setIsExpressingInterest] = React.useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)

  // Generate unique 10-digit property identifier
  // Use existing property_code if available, otherwise generate from property id
  const propertyUniqueId = React.useMemo(() => {
    if (property.property_code && property.property_code.length === 10 && /^\d{10}$/.test(property.property_code)) {
      return property.property_code
    }
    // Generate a unique 10-digit ID based on property id
    return generateUnitNumber(id, 0, 1)
  }, [property.property_code, id])

  const formattedPropertyId = formatUnitNumber(propertyUniqueId)

  const copyPropertyId = async () => {
    try {
      await navigator.clipboard.writeText(propertyUniqueId)
      setCopiedId(true)
      toast({
        title: "Property ID Copied!",
        description: `ID ${formattedPropertyId} copied to clipboard`,
      })
      setTimeout(() => setCopiedId(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleSaveProperty = () => {
    setIsSaved(!isSaved)
    toast({
      title: isSaved ? "Property Unsaved" : "Property Saved!",
      description: isSaved 
        ? "Removed from your saved properties" 
        : "Added to your saved properties. View them in your profile.",
    })
  }

  // Track property view and fetch counts
  React.useEffect(() => {
    const trackView = async () => {
      try {
        // Get or create session ID
        let sessionId = localStorage.getItem('viewSessionId')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          localStorage.setItem('viewSessionId', sessionId)
        }

        // Track the view
        await fetch(`/api/properties/${id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })

        // Fetch current counts
        const response = await fetch(`/api/properties/${id}/view`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.counts) {
            setViewCounts({
              dailyViews: data.counts.dailyViews || 0,
              totalViews: data.counts.totalViews || 0,
              interested: data.counts.interested || 0
            })
          }
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }

    trackView()

    // Check if user has expressed interest
    const checkInterest = async () => {
      try {
        const response = await fetch(`/api/properties/${id}/interested`)
        if (response.ok) {
          const data = await response.json()
          setHasExpressedInterest(data.hasExpressedInterest || false)
        }
      } catch (error) {
        console.error('Error checking interest:', error)
      }
    }

    checkInterest()
  }, [id])

  const handleExpressInterest = async () => {
    setIsExpressingInterest(true)
    try {
      const response = await fetch(`/api/properties/${id}/interested`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Interested in this property'
        })
      })

      const data = await response.json()

      if (data.success) {
        setHasExpressedInterest(true)
        setViewCounts(prev => ({
          ...prev,
          interested: data.interestedCount || prev.interested + 1
        }))
        toast({
          title: "Interest Recorded!",
          description: "The property owner will be notified of your interest.",
        })
      } else {
        throw new Error(data.error || 'Failed to express interest')
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
      toast({
        title: "Error",
        description: "Failed to record your interest. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExpressingInterest(false)
    }
  }

  const handleRemoveInterest = async () => {
    try {
      const response = await fetch(`/api/properties/${id}/interested`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setHasExpressedInterest(false)
        setViewCounts(prev => ({
          ...prev,
          interested: Math.max(0, prev.interested - 1)
        }))
        toast({
          title: "Interest Removed",
          description: "You are no longer marked as interested in this property.",
        })
      }
    } catch (error) {
      console.error('Error removing interest:', error)
      toast({
        title: "Error",
        description: "Failed to remove interest. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Collect all images from property_images table (from apartment wizard)
  const propertyImages = React.useMemo(() => {
    if (!property.property_images || property.property_images.length === 0) {
      console.log('No property_images found')
      return []
    }
    console.log('property_images from database:', property.property_images)
    const images = property.property_images.map(img => ({
      url: img.image_url,
      label: img.area,
      isPrimary: img.is_primary
    }))
    console.log('Processed propertyImages:', images)
    return images
  }, [property.property_images])

  // Collect all images from property details for gallery (legacy/manual details)
  const allDetailImages = React.useMemo(() => {
    if (!property.property_details) return []
    return property.property_details.flatMap(detail => 
      (detail.images || []).map(img => ({
        url: img.image_url,
        label: detail.detail_name
      }))
    )
  }, [property.property_details])

  // Combine all images: main image + property_images + detail images
  const allImages = React.useMemo(() => {
    const images: { url: string; label: string }[] = []
    
    // Add main image first if exists
    if (property.image_url) {
      images.push({ url: property.image_url, label: 'Main' })
    }
    
    // Add property_images (from apartment wizard) - skip if already added as main
    propertyImages.forEach(img => {
      if (img.url !== property.image_url) {
        images.push({ url: img.url, label: img.label })
      }
    })
    
    // Add detail images
    allDetailImages.forEach(img => {
      if (!images.some(i => i.url === img.url)) {
        images.push(img)
      }
    })
    
    console.log('Final allImages array:', images)
    console.log('Total images:', images.length)
    
    return images
  }, [property.image_url, propertyImages, allDetailImages])

  const handleUnitClick = (unit: Unit) => {
    if (unit.property_id && unit.property_id !== id) {
      router.push(`/properties/${unit.property_id}`)
    } else {
      // Open unit action dialog for all units (available or not)
      setSelectedUnit(unit)
      setUnitActionDialogOpen(true)
    }
  }

  // Format price (price_ugx can be null or a string depending on DB type)
  const priceUgx = Number((property as any).price_ugx)
  const monthlyRentUgx = Number.isFinite(priceUgx) ? priceUgx : 0
  const formattedPrice = Number.isFinite(priceUgx) ? (priceUgx / 100).toLocaleString() : '—'

  // Amenities
  const amenities = [
    { icon: Wifi, label: 'High-Speed WiFi' },
    { icon: Car, label: 'Parking Space' },
    { icon: AirVent, label: 'Air Conditioning' },
    { icon: ShowerHead, label: 'Hot Water' },
    { icon: Shield, label: 'Security 24/7' },
    { icon: Dumbbell, label: 'Gym Access' },
    { icon: Waves, label: 'Swimming Pool' },
    { icon: Trees, label: 'Garden Area' },
  ]

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title}${property.location ? ` at ${property.location}` : ''}`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        toast({
          title: "Shared Successfully!",
          description: "Thank you for sharing this property",
        })
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied!",
          description: "Property link copied to clipboard",
        })
      } catch (err) {
        console.error('Copy failed:', err)
        toast({
          title: "Share Failed",
          description: "Unable to share or copy link",
          variant: "destructive",
        })
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleOpenInMaps = () => {
    if (property.google_maps_embed_url) {
      window.open(property.google_maps_embed_url, '_blank')
    }
  }

  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images)
    setLightboxIndex(startIndex)
    setLightboxOpen(true)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1)
    } else if (direction === 'next' && lightboxIndex < lightboxImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1)
    }
  }

  return (
    <main className="bg-background min-h-screen">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant={isSaved ? "default" : "ghost"}
                size="sm"
                onClick={handleSaveProperty}
                className="transition-all hover:scale-105"
                title={isSaved ? "Remove from saved" : "Save property"}
              >
                <Heart className={`w-4 h-4 transition-all ${isSaved ? 'fill-current animate-in zoom-in-50' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="transition-all hover:scale-105"
                title="Share property"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrint}
                className="hidden sm:flex transition-all hover:scale-105"
                title="Print property details"
              >
                <PrinterIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero: Title + Main Image + Price - All visible at once */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{property.title}</h1>
                {property.is_active && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Available
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
                <button
                  onClick={copyPropertyId}
                  className="flex items-center gap-1.5 font-mono bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-lg transition-all hover:scale-105 group active:scale-95"
                  title="Click to copy Property ID"
                  aria-label="Copy property ID to clipboard"
                >
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="text-primary font-semibold tracking-wider">{formattedPropertyId}</span>
                  <Copy className={`w-3.5 h-3.5 ml-1 transition-all ${copiedId ? 'text-green-600 scale-125' : 'text-muted-foreground group-hover:text-primary'}`} />
                  {copiedId && (
                    <span className="text-xs text-green-600 ml-1 animate-in fade-in slide-in-from-left-2">
                      Copied!
                    </span>
                  )}
                </button>
                {property.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {property.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {property.category}
                </span>
              </div>
            </div>
            
            {/* Price - Always visible with animation */}
            <div className="flex items-center gap-4 lg:text-right">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-primary animate-in fade-in slide-in-from-top-2 duration-700">{formattedPrice}</p>
                <p className="text-sm text-muted-foreground">UGX / month</p>
                {!Number.isFinite(priceUgx) && (
                  <p className="text-xs text-muted-foreground mt-1">Price on request</p>
                )}
                {property.minimum_initial_months && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">
                      {property.minimum_initial_months} {property.minimum_initial_months === 1 ? 'Month' : 'Months'} Min. Deposit
                    </span>
                  </div>
                )}
              </div>
              <Button size="lg" className="hidden sm:flex gap-2 transition-all hover:scale-105 active:scale-95">
                <Phone className="w-4 h-4" />
                Contact
              </Button>
            </div>
          </div>

          {/* Quick Stats Bar - Always visible with hover effects */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors cursor-default">
              <BedDouble className="w-4 h-4 text-primary" />
              <span className="font-medium">{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80 transition-colors cursor-default">
              <WavesIcon className="w-4 h-4 text-primary" />
              <span className="font-medium">{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
            </div>
            {property.rating && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors cursor-default">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{property.rating} Rating</span>
              </div>
            )}
          </div>

          {/* Main Image with Thumbnail Strip */}
          <div className="space-y-3">
            <div 
              className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => {
                const imageUrls = allImages.map(i => i.url).filter(Boolean) as string[]
                if (imageUrls.length > 0) openLightbox(imageUrls, 0)
              }}
            >
              {property.image_url ? (
                <>
                  <Image
                    src={property.image_url}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {allImages.length > 1 && (
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-background/90">
                        <ImageIcon className="w-4 h-4" />
                        {allImages.length} Photos
                      </Badge>
                    )}
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-1.5 backdrop-blur-sm bg-background/90 hover:bg-background transition-all hover:scale-105"
                    >
                      <Maximize2 className="w-4 h-4" />
                      View Gallery
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Home className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All Content - No Tabs, Everything Visible */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Description - Always visible */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" />
                  About This Property
                </h2>
                {(() => {
                  const description = property.description || 'This beautiful property offers modern living in a prime location. With spacious rooms and excellent amenities, it provides the perfect home for you and your family.'
                  const isLongDescription = description.length > 300
                  const displayDescription = isLongDescription && !isDescriptionExpanded 
                    ? description.slice(0, 300) + '...' 
                    : description

                  return (
                    <div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {displayDescription}
                      </p>
                      {isLongDescription && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 p-0 h-auto text-primary hover:underline"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              Show less <ChevronUp className="w-4 h-4 ml-1" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Video Tour - Inline if available */}
              {property.video_url && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Video Tour
                  </h2>
                  <div className="rounded-xl overflow-hidden">
                    <PropertyVideoPlayer videoUrl={property.video_url} />
                  </div>
                </div>
              )}

              {/* Property Details with Images - Large Prominent Gallery (legacy/manual details) */}
              {property.property_details && property.property_details.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    Rooms & Spaces
                  </h2>
                  <div className="space-y-8">
                    {property.property_details.map((detail, detailIndex) => (
                      <div key={detail.id} className="space-y-4">
                        {/* Room Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold">{detail.detail_name}</h3>
                              <Badge variant="secondary" className="text-sm">
                                {detail.detail_type}
                              </Badge>
                            </div>
                            {detail.description && (
                              <p className="text-muted-foreground mt-2">{detail.description}</p>
                            )}
                          </div>
                          {detail.images && detail.images.length > 0 && (
                            <Badge variant="outline" className="gap-1.5">
                              <ImageIcon className="w-3 h-3" />
                              {detail.images.length} {detail.images.length === 1 ? 'photo' : 'photos'}
                            </Badge>
                          )}
                        </div>

                        {/* Large Image Grid */}
                        {detail.images && detail.images.length > 0 && (
                          <>
                            {detail.images.length === 1 ? (
                              // Single large image
                              <div
                                className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                                onClick={() => {
                                  const detailImages = detail.images?.map(img => img.image_url) || []
                                  openLightbox(detailImages, 0)
                                }}
                              >
                                <Image
                                  src={detail.images[0].image_url}
                                  alt={detail.detail_name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  sizes="(max-width: 768px) 100vw, 66vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 className="w-4 h-4" />
                                  View Full Size
                                </div>
                              </div>
                            ) : detail.images.length === 2 ? (
                              // Two large images side by side
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {detail.images.map((image, imgIndex) => (
                                  <div
                                    key={image.id}
                                    className="relative h-[300px] sm:h-[400px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                                    onClick={() => {
                                      const detailImages = detail.images?.map(img => img.image_url) || []
                                      openLightbox(detailImages, imgIndex)
                                    }}
                                  >
                                    <Image
                                      src={image.image_url}
                                      alt={`${detail.detail_name} - ${imgIndex + 1}`}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                      sizes="(max-width: 640px) 100vw, 50vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Maximize2 className="w-3 h-3" />
                                      Expand
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Grid layout: First image large, others in grid
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Hero image (first one) - spans full width on mobile, left column on desktop */}
                                <div
                                  className={`relative ${detail.images.length > 2 ? 'sm:row-span-2 h-[300px] sm:h-[500px]' : 'h-[300px] sm:h-[400px]'} rounded-2xl overflow-hidden cursor-pointer group shadow-lg`}
                                  onClick={() => {
                                    const detailImages = detail.images?.map(img => img.image_url) || []
                                    openLightbox(detailImages, 0)
                                  }}
                                >
                                  <Image
                                    src={detail.images[0].image_url}
                                    alt={`${detail.detail_name} - Main`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Maximize2 className="w-4 h-4" />
                                    View
                                  </div>
                                </div>

                                {/* Additional images */}
                                {detail.images.slice(1, detail.images.length > 4 ? 4 : detail.images.length).map((image, imgIndex) => (
                                  <div
                                    key={image.id}
                                    className="relative h-[200px] sm:h-[244px] rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                                    onClick={() => {
                                      const detailImages = detail.images?.map(img => img.image_url) || []
                                      openLightbox(detailImages, imgIndex + 1)
                                    }}
                                  >
                                    <Image
                                      src={image.image_url}
                                      alt={`${detail.detail_name} - ${imgIndex + 2}`}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                      sizes="(max-width: 640px) 100vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    
                                    {/* Show "View All" overlay on last visible image if there are more */}
                                    {imgIndex === 2 && detail.images && detail.images.length > 4 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="text-white text-center">
                                          <Plus className="w-8 h-8 mx-auto mb-1" />
                                          <p className="font-semibold">+{detail.images.length - 4} more</p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Maximize2 className="w-3 h-3" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Separator between rooms */}
                        {detailIndex < (property.property_details?.length || 0) - 1 && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities - Compact Grid, Always Visible */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {amenities.map((amenity, index) => {
                    const Icon = amenity.icon
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm transition-all hover:bg-muted hover:scale-105 cursor-default"
                        title={amenity.label}
                      >
                        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{amenity.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPinned className="w-5 h-5 text-primary" />
                  Location
                </h2>
                
                {property?.location ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden border bg-muted/50 p-8">
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50">
                        {/* Map Icon Background Decoration */}
                        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
                          <MapPin className="w-full h-full text-blue-600" />
                        </div>
                        
                        <div className="relative p-6 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-100">
                                  <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Location</h3>
                              </div>
                              <p className="text-sm text-slate-600 pl-11">{property.location}</p>
                            </div>
                          </div>

                          {/* Map Preview Graphic */}
                          {property.google_maps_embed_url && (
                            <div className="space-y-3">
                              {/* Compact Map Preview */}
                              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                <iframe
                                  src={property.google_maps_embed_url}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0, pointerEvents: 'none' }}
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title="Property Location Map Preview"
                                />
                                {/* Overlay to prevent interaction */}
                                <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={handleOpenInMaps}></div>
                              </div>

                              {/* CTA Button */}
                              <Button
                                variant="default"
                                size="default"
                                onClick={handleOpenInMaps}
                                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                              >
                                <MapPin className="w-4 h-4" />
                                View in Google Maps
                                <ExternalLink className="w-4 h-4" />
                              </Button>

                              {/* Trust Indicator */}
                              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span>Verified location</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted h-48 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">Location not specified</p>
                      <p className="text-sm">No map available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Specifications Table */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Property Details
                </h2>
                <div className="border rounded-xl divide-y">
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium">{property.category}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Bedrooms</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Bathrooms</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={property.is_active ? "default" : "secondary"}>
                      {property.is_active ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-muted-foreground">Property ID</span>
                    <span className="font-mono text-sm text-muted-foreground">{id.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Sticky Contact Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                {/* Contact Card */}
                <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-gradient-to-b from-background to-background/95">
                  {/* Price Header - Premium Design */}
                  <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-5 px-5 border-b">
                    <div className="absolute top-0 left-0 w-full h-full bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
                    <div className="relative space-y-2">
                      {/* Status Badge */}
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Available Now</span>
                        </div>
                      </div>
                      
                      {/* Price Display */}
                      <div className="text-center">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Monthly Rent</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-primary tracking-tight">
                            {formattedPrice}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">UGX</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">per month</p>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-5 space-y-4">
                    {/* Primary Actions */}
                    <div className="space-y-2.5">
                      {/* Contact Agent - Primary CTA */}
                      <Button 
                        className="w-full gap-2 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all group relative overflow-hidden" 
                        size="lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        <Phone className="w-4 h-4" />
                        Contact Agent
                        <Badge variant="secondary" className="ml-auto text-xs">Fast Reply</Badge>
                      </Button>

                      {/* Action Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <ScheduleVisitDialog 
                          propertyId={property.id}
                          propertyTitle={property.title}
                          propertyLocation={property.location || ''}
                          triggerButton={
                            <Button 
                              variant="outline" 
                              className="w-full h-20 hover:bg-primary/5 hover:border-primary/30 transition-all group flex-col gap-1.5 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-lg" />
                              <Calendar className="w-5 h-5 group-hover:text-primary transition-colors relative z-10" />
                              <span className="text-xs font-medium relative z-10">Schedule Visit</span>
                            </Button>
                          }
                        />
                        <ApplyNowDialog
                          propertyId={property.id}
                          propertyTitle={property.title}
                          propertyLocation={property.location || ''}
                          triggerButton={
                            <Button 
                              variant="outline" 
                              className="w-full h-20 hover:bg-primary/5 hover:border-primary/30 transition-all group flex-col gap-1.5 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-lg" />
                              <FileText className="w-5 h-5 group-hover:text-primary transition-colors relative z-10" />
                              <span className="text-xs font-medium relative z-10">Apply Now</span>
                            </Button>
                          }
                        />
                      </div>
                    </div>
                    
                    {/* Reserve Section */}
                    <div className="pt-2 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Separator className="flex-1" />
                        <span className="text-xs font-medium text-muted-foreground px-2">Secure Your Spot</span>
                        <Separator className="flex-1" />
                      </div>
                      
                      <ReservePropertyDialog
                        propertyId={property.id}
                        propertyTitle={property.title}
                        propertyLocation={property.location || ''}
                        monthlyRent={monthlyRentUgx}
                        propertyCode={propertyUniqueId}
                        triggerButton={
                          <Button 
                            className="w-full gap-2 h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                            size="lg"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            <Sparkles className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">Reserve Property</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        }
                      />
                      
                      {/* Rent Property Button */}
                      {property.minimum_initial_months && (
                        <Button 
                          onClick={() => setPaymentDialogOpen(true)}
                          variant="outline"
                          className="w-full gap-2 h-12 text-base font-semibold border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all group"
                          size="lg"
                        >
                          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                          <span>Rent Property</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                      
                      {/* Info Badge */}
                      <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Make a deposit on this Property</span>
                        </p>
                      </div>
                    </div>

                    {/* Trust Indicators - Inline */}
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-green-500/10">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium">Verified</p>
                            <p className="text-xs text-muted-foreground">Property</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-blue-500/10">
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium">Secure</p>
                            <p className="text-xs text-muted-foreground">Payment</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Stats - Real-time data */}
                <Card className="border border-muted/50 shadow-sm bg-muted/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-background">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{viewCounts.dailyViews}</p>
                          <p className="text-xs text-muted-foreground">Views today</p>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-background">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{viewCounts.interested}</p>
                          <p className="text-xs text-muted-foreground">Interested</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Express Interest Button */}
                <Card className="border border-primary/20 shadow-sm bg-primary/5">
                  <CardContent className="p-4">
                    {hasExpressedInterest ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <p className="text-sm font-medium">You're interested in this property</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveInterest}
                          className="w-full"
                        >
                          Remove Interest
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleExpressInterest}
                        disabled={isExpressingInterest}
                        className="w-full gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {isExpressingInterest ? 'Processing...' : "I'm Interested"}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      The property owner will be notified
                    </p>
                  </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="border border-muted/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Need Help?</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Our support team is available 24/7 to answer your questions
                        </p>
                        <Button variant="link" className="h-auto p-0 text-xs font-medium">
                          Chat with us →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges - Compact */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Why Choose Us
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        'Verified & inspected property',
                        'Secure payment processing',
                        '24/7 customer support',
                        'No hidden fees'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Building Visualization - For apartments, hostels, and office buildings */}
      {(property.category === 'Apartment' || property.category === 'Hostel' || property.category === 'Office Building') && (property.property_blocks || property.total_floors) && (
        <section className="border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BuildingBlockVisualization
              buildingName={
                Array.isArray(property.property_blocks)
                  ? property.property_blocks[0]?.name || property.title
                  : property.property_blocks?.name || property.title
              }
              totalFloors={
                Array.isArray(property.property_blocks)
                  ? property.property_blocks[0]?.total_floors || property.total_floors || 1
                  : property.property_blocks?.total_floors || property.total_floors || 1
              }
              units={
                // Get ALL units from the property block (includes all unit types)
                (() => {
                  const blockUnits = Array.isArray(property.property_blocks)
                    ? property.property_blocks[0]?.property_units
                    : property.property_blocks?.property_units
                  
                  // Fall back to property_units if no block units found
                  const units = blockUnits || property.property_units || []
                  
                  return units.map(unit => ({
                    id: unit.id,
                    unitNumber: unit.unit_number,
                    floor: unit.floor_number,
                    type: unit.unit_type || `${unit.bedrooms}BR`,
                    isAvailable: unit.is_available,
                    price: unit.price_ugx,
                    bedrooms: unit.bedrooms,
                    bathrooms: unit.bathrooms,
                    property_id: unit.property_id || id
                  }))
                })() || []
              }
              floorUnitConfig={property.floor_unit_config}
              currentPropertyId={id}
              onUnitClick={handleUnitClick}
            />
          </div>
        </section>
      )}


      {/* Enhanced Lightbox Dialog with Keyboard Navigation */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="max-w-7xl w-full p-0 bg-black/95 border-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') navigateLightbox('prev')
            if (e.key === 'ArrowRight') navigateLightbox('next')
            if (e.key === 'Escape') setLightboxOpen(false)
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Property Image Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 transition-all hover:scale-110"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {lightboxImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 h-12 w-12"
                  onClick={() => navigateLightbox('prev')}
                  disabled={lightboxIndex === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-110 h-12 w-12"
                  onClick={() => navigateLightbox('next')}
                  disabled={lightboxIndex === lightboxImages.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image with smooth transition */}
            {lightboxImages[lightboxIndex] && (
              <div className="relative w-full h-full animate-in fade-in duration-300">
                <Image
                  src={lightboxImages[lightboxIndex]}
                  alt={`Property image ${lightboxIndex + 1} of ${lightboxImages.length}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            )}

            {/* Enhanced Counter and Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
              {allImages[lightboxIndex] && (
                <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
                  {allImages[lightboxIndex].label}
                </Badge>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm hidden sm:block">
              Use arrow keys to navigate
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Unit Action Dialog */}
      <UnitActionDialog
        unit={selectedUnit}
        propertyId={property.id}
        propertyTitle={property.title}
        propertyLocation={property.location || ''}
        propertyCode={propertyUniqueId}
        open={unitActionDialogOpen}
        onOpenChange={setUnitActionDialogOpen}
        minimumDepositMonths={property.minimum_initial_months}
      />

      {/* Payment Dialog */}
      <PesapalPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        amount={(monthlyRentUgx / 100) * (Number(property.minimum_initial_months) || 1)}
        monthlyAmount={monthlyRentUgx / 100}
        depositMonths={Number(property.minimum_initial_months) || 1}
        propertyCode={propertyUniqueId}
        propertyTitle={property.title}
        propertyId={property.id}
        onSuccess={(transactionId) => {
          toast({
            title: "Payment Successful!",
            description: `Your deposit payment for ${property.title} has been completed successfully.`,
          })
        }}
      />
    </main>
  )
}
