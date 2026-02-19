'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Heart, 
  ArrowRight, 
  Star,
  Eye,
  CheckCircle2,
  TrendingUp,
  Hash
} from 'lucide-react'
import { HeroSearchBar, SearchFilters } from '@/components/publicView/hero-search-bar'
import { useSearchParams } from 'next/navigation'
import { generateUnitNumber, formatUnitNumber } from '@/lib/unit-number-generator'

// Same formatting pattern as FeaturedPropertyCard (home page)
const formatUgx = (amount: number) => new Intl.NumberFormat('en-UG').format(amount)

interface PropertyItem {
  id: string
  title: string
  location: string
  // Can come back as string/number depending on DB column type (numeric/bigint)
  price_ugx: number | string | null
  bedrooms: number
  bathrooms: number
  image_url: string | null
}

interface PropertiesPageContentProps {
  initialProperties: PropertyItem[]
}

export default function PropertiesPageContent({ initialProperties }: PropertiesPageContentProps) {
  const searchParams = useSearchParams()
  
  // Get initial filters from URL params (only computed once)
  const initialFiltersFromUrl = useMemo(() => ({
    location: searchParams?.get('location') || '',
    propertyType: searchParams?.get('type') || '',
    bedrooms: searchParams?.get('bedrooms') || '',
    bathrooms: searchParams?.get('bathrooms') || '',
    priceRange: searchParams?.get('price') || '',
    sortBy: searchParams?.get('sort') || 'newest',
  }), []) // Empty deps - only compute once on mount
  
  const [filters, setFilters] = useState<SearchFilters>(initialFiltersFromUrl)
  const [isFiltering, setIsFiltering] = useState(false)

  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setIsFiltering(true)
    setFilters(newFilters)
    // Reset filtering state after a short delay to show smooth transition
    setTimeout(() => setIsFiltering(false), 150)
  }, [])

  // Transform properties to display format
  // Keep the raw price_ugx so the UI can reliably compute amounts and avoid NaN
  const properties = initialProperties.map((prop) => {
    const rawPrice = Number(prop.price_ugx)
    const monthly = Number.isFinite(rawPrice) ? rawPrice / 100 : null

    return {
      id: prop.id,
      title: prop.title,
      location: prop.location,
      price_ugx: prop.price_ugx,
      monthlyRent: monthly,
      monthlyRentDisplay: monthly === null ? 'Contact for price' : formatUgx(monthly),
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area: 120, // Default area - can be enhanced if stored in DB
      image_url: prop.image_url || '/placeholder.jpg',
    }
  })

  // Filter properties based on current filters
  const filterProperties = (props: typeof properties): typeof properties => {
    return props.filter((property) => {
      // Location filter
      if (
        filters.location &&
        !property.location.toLowerCase().includes(filters.location.toLowerCase()) &&
        !property.title.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false
      }

      // Property type filter
      if (filters.propertyType && filters.propertyType !== '') {
        // You can add property type to the PropertyItem interface and check here
        // For now, we'll skip this filter if not available
      }

      // Bedrooms filter
      if (filters.bedrooms && filters.bedrooms !== '') {
        const bedroomsFilter = parseInt(filters.bedrooms)
        if (filters.bedrooms === '5') {
          // 5+ bedrooms
          if (property.bedrooms < 5) return false
        } else if (property.bedrooms !== bedroomsFilter) {
          return false
        }
      }

      // Bathrooms filter
      if (filters.bathrooms && filters.bathrooms !== '') {
        const bathroomsFilter = parseInt(filters.bathrooms)
        if (filters.bathrooms === '4') {
          // 4+ bathrooms
          if (property.bathrooms < 4) return false
        } else if (property.bathrooms !== bathroomsFilter) {
          return false
        }
      }

      // Price range filter
      if (filters.priceRange && filters.priceRange !== '') {
        const priceNum = parseInt(property.price.replace(/,/g, ''))
        
        if (filters.priceRange.includes('+')) {
          // e.g., "5000000+"
          const minPrice = parseInt(filters.priceRange.replace('+', ''))
          if (priceNum < minPrice) return false
        } else if (filters.priceRange.includes('-')) {
          // e.g., "500000-1000000"
          const [min, max] = filters.priceRange.split('-').map(p => parseInt(p))
          if (priceNum < min || priceNum > max) return false
        }
      }

      return true
    })
  }

  // Sort properties
  const sortProperties = (props: typeof properties): typeof properties => {
    const sorted = [...props]
    switch (filters.sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/,/g, ''))
          const priceB = parseInt(b.price.replace(/,/g, ''))
          return priceA - priceB
        })
      case 'price_desc':
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/,/g, ''))
          const priceB = parseInt(b.price.replace(/,/g, ''))
          return priceB - priceA
        })
      default:
        return sorted
    }
  }

  const filteredAndSorted = useMemo(
    () => sortProperties(filterProperties(properties)),
    [filters]
  )

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="py-4 sm:py-6 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Find Your Perfect Home
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Browse from our collection of verified, quality properties
            </p>
          </div>
        </div>
      </section>

      {/* Properties Section with Filters */}
      <section className="py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Search Bar */}
          <div className="mb-6">
            <HeroSearchBar 
              onSearch={handleFilterChange}
              showSearchButton={false}
              enableDynamicSearch={true}
              debounceMs={300}
              initialValues={initialFiltersFromUrl}
            />
          </div>

          <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Available Properties <span className="text-primary">({filteredAndSorted.length})</span>
                </h2>
                {isFiltering && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Filtering...
                  </div>
                )}
              </div>

              {/* Properties Grid */}
              {filteredAndSorted.length > 0 ? (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-150 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
                  {filteredAndSorted.map((property) => {
                    // Generate unique property ID
                    const propertyUniqueId = generateUnitNumber(property.id, 0, 1)
                    const formattedPropertyId = formatUnitNumber(propertyUniqueId)
                    
                    return (
                      <Link key={property.id} href={`/properties/${property.id}`} className="group block h-full">
                        <Card className="overflow-hidden transition-all duration-300 cursor-pointer h-full hover:shadow-2xl hover:-translate-y-2 border-2 border-border/40 bg-card shadow-lg hover:shadow-primary/20 hover:border-primary/30">
                          {/* Image Container with Overlay */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <Image
                              src={property.image_url || "/placeholder.svg?height=400&width=400"}
                              alt={property.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
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

                            {/* Favorite Button - Top Left */}
                            <div 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Handle save/favorite action here
                              }}
                              className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer hover:bg-white shadow-lg"
                            >
                              <Heart className="w-4 h-4 text-red-500" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-3">
                            {/* Title and Location */}
                            <div className="space-y-2">
                              <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                {property.title}
                              </h3>
                              
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
                                  {(() => {
                                    return (
                                      <>
                                        <span className="font-bold text-2xl text-primary">
                                          {property.monthlyRentDisplay}
                                        </span>
                                        {property.monthlyRent !== null && (
                                          <span className="text-xs text-muted-foreground font-medium">
                                            UGX
                                          </span>
                                        )}
                                      </>
                                    )
                                  })()}
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
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="space-y-3">
                    <p className="text-lg text-muted-foreground">No properties match your filters</p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFilters({
                          location: '',
                          propertyType: '',
                          bedrooms: '',
                          bathrooms: '',
                          priceRange: '',
                          sortBy: 'newest',
                        })
                      }
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">Ready to Apply?</h2>
          <p className="text-xl text-muted-foreground">
            Create an account and start your rental journey today
          </p>
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
