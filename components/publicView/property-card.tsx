'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Hash, 
  MapPin, 
  Bed, 
  Bath, 
  Star, 
  Eye,
  Video,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'
import { generateUnitNumber, formatUnitNumber } from '@/lib/unit-number-generator'

// Define the Property interface to match the data structure from the API
interface Property {
  id: string
  property_code?: string  // Unique 10-digit identifier
  title: string
  location: string
  price_ugx: number
  image_url: string | null
  category: string
  bedrooms: number
  bathrooms: number
  description: string | null
  video_url: string | null
  rating: number
  reviews_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  property_blocks?: {
    id: string
    name: string
    location: string
    total_floors: number
    total_units: number
  }
  property_units?: Array<{
    id: string
    block_id: string
    floor_number: number
    unit_number: string
    bedrooms: number
    bathrooms: number
    is_available: boolean
  }>
}

export function PropertyCard({ property }: { property: Property }) {
  // Generate unique 10-digit property identifier
  // Use existing property_code if valid, otherwise generate from property id
  const propertyUniqueId = (() => {
    if (property.property_code && property.property_code.length === 10 && /^\d{10}$/.test(property.property_code)) {
      return property.property_code
    }
    return generateUnitNumber(property.id, 0, 1)
  })()

  const formattedPropertyId = formatUnitNumber(propertyUniqueId)

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <Card className="overflow-hidden transition-all duration-300 cursor-pointer h-full hover:shadow-2xl hover:-translate-y-2 border-2 border-border/40 bg-card shadow-lg hover:shadow-primary/20 hover:border-primary/30">
        {/* Image Container with Overlay */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={property.image_url || "/placeholder.svg?height=400&width=400&query=modern+house"}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2 z-10">
            <div className="flex gap-2 flex-wrap">
              {property.video_url && (
                <Badge className="bg-red-500/90 hover:bg-red-500 text-white shadow-lg backdrop-blur-sm border-0 gap-1.5 font-medium">
                  <Video className="w-3.5 h-3.5" />
                  Video Tour
                </Badge>
              )}
              <Badge className="bg-white/95 text-gray-900 backdrop-blur-sm hover:bg-white shadow-lg border-0 font-medium">
                {property.category}
              </Badge>
            </div>
          </div>

          {/* Verified Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <div className="bg-green-500/95 text-white px-2.5 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </div>
          </div>
          
          {/* Property ID Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-md font-mono text-xs gap-1.5 px-3 py-1.5 border-0 shadow-lg">
              <Hash className="w-3 h-3" />
              {formattedPropertyId}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Title and Rating */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {property.title}
              </h3>
              {(property.rating || property.reviews_count > 0) && (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-amber-700">
                    {property.rating || "5.0"}
                  </span>
                </div>
              )}
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <p className="text-sm line-clamp-1">{property.location}</p>
            </div>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pb-3 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4" />
              <span className="font-medium">{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4" />
              <span className="font-medium">{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-2xl text-primary">
                  {formatPrice(property.price_ugx / 100)}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  UGX
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">per month</p>
            </div>
            
            {/* View Details Button - Shows on Hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md">
                <Eye className="w-4 h-4" />
                View
              </div>
            </div>
          </div>

          {/* Trust Indicator */}
          {property.reviews_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-medium">{property.reviews_count} people interested</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
