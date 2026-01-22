'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Hash } from 'lucide-react'
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
      <Card className="overflow-hidden border-none shadow-none bg-transparent transition-all cursor-pointer h-full hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <Image
            src={property.image_url || "/placeholder.svg?height=400&width=400&query=modern+house"}
            alt={property.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {property.video_url && (
              <Badge className="bg-red-500 hover:bg-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
                Video
              </Badge>
            )}
            <Badge className="bg-background/80 text-foreground backdrop-blur-sm hover:bg-background/90">
              {property.category}
            </Badge>
          </div>
          {/* Property ID Badge - Bottom right of image */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm font-mono text-xs gap-1 px-2 py-1">
              <Hash className="w-3 h-3 text-primary" />
              {formattedPropertyId}
            </Badge>
          </div>
        </div>
        <CardHeader className="p-4 px-0 pt-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg truncate">{property.title}</h3>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>★</span> {property.rating || "New"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 px-0">
          <p className="text-muted-foreground text-sm line-clamp-1">{property.location}</p>
        </CardContent>
        <CardFooter className="p-4 px-0 pt-0">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-lg">{formatPrice(property.price_ugx / 100)}</span>
            <span className="text-muted-foreground text-sm">per month</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
