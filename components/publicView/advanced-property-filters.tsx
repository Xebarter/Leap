'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'

export interface FilterOptions {
  location: string
  priceMin: number
  priceMax: number
  bedrooms: string
  bathrooms: string
  category: string
  sortBy: string
}

interface AdvancedPropertyFiltersProps {
  onFilter: (filters: FilterOptions) => void
  showCompact?: boolean
}

const PRICE_RANGES = {
  'Under 500K': { min: 0, max: 500000 },
  '500K - 1M': { min: 500000, max: 1000000 },
  '1M - 2M': { min: 1000000, max: 2000000 },
  '2M - 3M': { min: 2000000, max: 3000000 },
  '3M - 5M': { min: 3000000, max: 5000000 },
  '5M+': { min: 5000000, max: 100000000 },
}

const CATEGORIES = ['Apartment', 'House', 'Villa', 'Studio', 'Cottage', 'Townhouse']
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Best Rating', value: 'rating' },
]

export function AdvancedPropertyFilters({
  onFilter,
  showCompact = false,
}: AdvancedPropertyFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    priceMin: 0,
    priceMax: 5000000,
    bedrooms: '',
    bathrooms: '',
    category: '',
    sortBy: 'newest',
  })

  const [isExpanded, setIsExpanded] = useState(!showCompact)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: string | number) => {
      // Convert "all" to empty string for bedrooms, bathrooms, and category
      const normalizedValue = (value === 'all') ? '' : value
      const newFilters = { ...filters, [key]: normalizedValue }
      setFilters(newFilters)
      onFilter(newFilters)
    },
    [filters, onFilter]
  )

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setPriceRange(newRange)
    setFilters((prev) => ({
      ...prev,
      priceMin: newRange[0],
      priceMax: newRange[1],
    }))
    onFilter({
      ...filters,
      priceMin: newRange[0],
      priceMax: newRange[1],
    })
  }

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      location: '',
      priceMin: 0,
      priceMax: 5000000,
      bedrooms: '',
      bathrooms: '',
      category: '',
      sortBy: 'newest',
    }
    setFilters(defaultFilters)
    setPriceRange([0, 5000000])
    onFilter(defaultFilters)
  }

  const hasActiveFilters =
    filters.location ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.category ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 5000000

  if (!isExpanded && showCompact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters {hasActiveFilters && <span className="ml-1 text-xs">({Object.values(filters).filter(Boolean).length})</span>}
      </Button>
    )
  }

  return (
    <Card className="p-6 space-y-6 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        {showCompact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Location Search */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="location"
            placeholder="Search by location..."
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label>Price Range (UGX)</Label>
        <div className="flex gap-2">
          <Select
            value={
              Object.entries(PRICE_RANGES).find(
                ([_, range]) =>
                  range.min === priceRange[0] && range.max === priceRange[1]
              )?.[0] || ''
            }
            onValueChange={(value) => {
              const range = PRICE_RANGES[value as keyof typeof PRICE_RANGES]
              if (range) {
                handlePriceRangeChange([range.min, range.max])
              }
            }}
          >
            <SelectTrigger className="bg-muted/50">
              <SelectValue placeholder="Quick select..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRICE_RANGES).map(([label, _]) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground">
            {isHydrated ? (
              <>
                {new Intl.NumberFormat('en-US').format(priceRange[0])} - {new Intl.NumberFormat('en-US').format(priceRange[1])}
              </>
            ) : (
              <>
                0 - 5,000,000
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label htmlFor="bedrooms">Bedrooms</Label>
        <Select value={filters.bedrooms || 'all'} onValueChange={(value) => handleFilterChange('bedrooms', value)}>
          <SelectTrigger id="bedrooms" className="bg-muted/50">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4">4 Bedrooms</SelectItem>
            <SelectItem value="5+">5+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label htmlFor="bathrooms">Bathrooms</Label>
        <Select value={filters.bathrooms || 'all'} onValueChange={(value) => handleFilterChange('bathrooms', value)}>
          <SelectTrigger id="bathrooms" className="bg-muted/50">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="1">1 Bathroom</SelectItem>
            <SelectItem value="2">2 Bathrooms</SelectItem>
            <SelectItem value="3">3 Bathrooms</SelectItem>
            <SelectItem value="4+">4+ Bathrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Property Type</Label>
        <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
          <SelectTrigger id="category" className="bg-muted/50">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label htmlFor="sortBy">Sort By</Label>
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger id="sortBy" className="bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReset}
          disabled={!hasActiveFilters}
        >
          Reset
        </Button>
        {showCompact && (
          <Button className="flex-1" onClick={() => setIsExpanded(false)}>
            Apply Filters
          </Button>
        )}
      </div>
    </Card>
  )
}
