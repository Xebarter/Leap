'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, Square, Heart, ArrowRight } from 'lucide-react'
import { HeroSearchBar, SearchFilters } from '@/components/publicView/hero-search-bar'
import { useSearchParams } from 'next/navigation'

interface PropertyItem {
  id: string
  title: string
  location: string
  price_ugx: number
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
  const properties = initialProperties.map(prop => ({
    id: prop.id,
    title: prop.title,
    location: prop.location,
    price: (prop.price_ugx / 100).toLocaleString(), // Convert from cents to display
    bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms,
    area: 120, // Default area - can be enhanced if stored in DB
    image_url: prop.image_url || '/placeholder.jpg',
  }))

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
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 transition-opacity duration-150 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
                  {filteredAndSorted.map((property) => (
                    <Link key={property.id} href={`/properties/${property.id}`} className="group block">
                      <Card className="border-none shadow-none bg-muted/50 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                        {/* Image */}
                        <div className="h-40 sm:h-48 relative overflow-hidden">
                          <Image
                            src={property.image_url}
                            alt={property.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          <div 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle save/favorite action here
                            }}
                            className="absolute top-4 right-4 bg-background/80 backdrop-blur rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer hover:bg-background"
                          >
                            <Heart className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Content */}
                        <CardHeader className="space-y-2 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="line-clamp-1 text-base sm:text-lg">{property.title}</CardTitle>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="line-clamp-1">{property.location}</span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0">
                          {/* Price */}
                          <div className="text-xl sm:text-2xl font-bold text-primary">
                            UGX {property.price}
                            <span className="text-xs sm:text-sm text-muted-foreground font-normal">/month</span>
                          </div>

                          {/* Features */}
                          <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              {property.bedrooms} Bed
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4" />
                              {property.bathrooms} Bath
                            </div>
                            <div className="flex items-center gap-1">
                              <Square className="w-4 h-4" />
                              {property.area} m²
                            </div>
                          </div>

                          {/* CTA - Now just visual, entire card is clickable */}
                          <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background group-hover:bg-accent group-hover:text-accent-foreground transition-colors flex items-center justify-center gap-2">
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
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
