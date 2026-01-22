'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeroSearchBarProps {
  onSearch?: (filters: SearchFilters) => void
  showSearchButton?: boolean
  initialValues?: Partial<SearchFilters>
}

export interface SearchFilters {
  location: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  priceRange: string
  sortBy: string
}

// Stable empty default to avoid creating new object on every render
const EMPTY_INITIAL_VALUES: Partial<SearchFilters> = {}

export function HeroSearchBar({ 
  onSearch, 
  showSearchButton = true,
  initialValues
}: HeroSearchBarProps) {
  const router = useRouter()
  
  // Use stable reference for initialValues
  const initValues = initialValues || EMPTY_INITIAL_VALUES
  
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    location: initValues.location || '',
    propertyType: initValues.propertyType || '',
    bedrooms: initValues.bedrooms || '',
    bathrooms: initValues.bathrooms || '',
    priceRange: initValues.priceRange || '',
    sortBy: initValues.sortBy || 'newest',
  }))

  // Keep a ref to onSearch to avoid dependency issues
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      // If onSearch callback is provided, call it immediately
      if (onSearchRef.current) {
        onSearchRef.current(newFilters)
      }
      
      return newFilters
    })
  }, [])

  const handleSearch = useCallback(() => {
    if (onSearchRef.current) {
      onSearchRef.current(filters)
    } else {
      // Navigate to properties page with filters as URL params
      const params = new URLSearchParams()
      if (filters.location) params.set('location', filters.location)
      if (filters.propertyType) params.set('type', filters.propertyType)
      if (filters.bedrooms) params.set('bedrooms', filters.bedrooms)
      if (filters.bathrooms) params.set('bathrooms', filters.bathrooms)
      if (filters.priceRange) params.set('price', filters.priceRange)
      if (filters.sortBy) params.set('sort', filters.sortBy)
      
      router.push(`/properties?${params.toString()}`)
    }
  }, [filters, router])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-background/80 backdrop-blur-sm p-2.5 rounded-xl shadow-2xl border-2 border-primary/10">
        {/* Main Search Row */}
        <div className="flex flex-col lg:flex-row gap-2 mb-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input 
              placeholder="Enter location (e.g., Kampala, Entebbe)" 
              className="pl-10 h-11 text-sm border-0 bg-muted/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          {showSearchButton && (
            <Button size="default" className="h-11 px-6 text-sm" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {/* Property Type */}
          <div className="relative">
            <select 
              className="w-full h-10 px-3 pr-8 text-xs bg-muted/50 border-0 rounded-lg appearance-none cursor-pointer hover:bg-muted/70 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={filters.propertyType}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            >
              <option value="">Property Type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
              <option value="villa">Villa</option>
              <option value="cottage">Cottage</option>
              <option value="townhouse">Townhouse</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Bedrooms */}
          <div className="relative">
            <select 
              className="w-full h-10 px-3 pr-8 text-xs bg-muted/50 border-0 rounded-lg appearance-none cursor-pointer hover:bg-muted/70 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={filters.bedrooms}
              onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
            >
              <option value="">Bedrooms</option>
              <option value="1">1 Bed</option>
              <option value="2">2 Beds</option>
              <option value="3">3 Beds</option>
              <option value="4">4 Beds</option>
              <option value="5">5+ Beds</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Bathrooms */}
          <div className="relative">
            <select 
              className="w-full h-10 px-3 pr-8 text-xs bg-muted/50 border-0 rounded-lg appearance-none cursor-pointer hover:bg-muted/70 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={filters.bathrooms}
              onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
            >
              <option value="">Bathrooms</option>
              <option value="1">1 Bath</option>
              <option value="2">2 Baths</option>
              <option value="3">3 Baths</option>
              <option value="4">4+ Baths</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Price Range */}
          <div className="relative">
            <select 
              className="w-full h-10 px-3 pr-8 text-xs bg-muted/50 border-0 rounded-lg appearance-none cursor-pointer hover:bg-muted/70 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            >
              <option value="">Price Range</option>
              <option value="0-500000">Under 500K</option>
              <option value="500000-1000000">500K - 1M</option>
              <option value="1000000-2000000">1M - 2M</option>
              <option value="2000000-3000000">2M - 3M</option>
              <option value="3000000-5000000">3M - 5M</option>
              <option value="5000000+">5M+</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select 
              className="w-full h-10 px-3 pr-8 text-xs bg-muted/50 border-0 rounded-lg appearance-none cursor-pointer hover:bg-muted/70 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Best Rating</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
