'use client';

import { useState, useEffect } from 'react';
import { PropertyCard } from './property-card';
import { AdvancedPropertyFilters, FilterOptions } from './advanced-property-filters';

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

interface PropertyListWithFiltersProps {
  initialProperties?: Property[]; // Make it optional
}

export function PropertyListWithFilters({ initialProperties = [] }: PropertyListWithFiltersProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [filters, setFilters] = useState<FilterOptions>({
    location: '',
    priceMin: 0,
    priceMax: 5000000,
    bedrooms: '',
    bathrooms: '',
    category: '',
    sortBy: 'newest',
  });
  
  // Apply filters to properties
  useEffect(() => {
    let filtered = [...initialProperties];
    
    if (filters.location) {
      filtered = filtered.filter(property => 
        property.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        property.title.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    filtered = filtered.filter(property => 
      property.price_ugx >= filters.priceMin && property.price_ugx <= filters.priceMax
    );
    
    if (filters.bedrooms) {
      filtered = filtered.filter(property => 
        String(property.bedrooms) === filters.bedrooms
      );
    }
    
    if (filters.bathrooms) {
      filtered = filtered.filter(property => 
        String(property.bathrooms) === filters.bathrooms
      );
    }
    
    if (filters.category) {
      filtered = filtered.filter(property => 
        property.category.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price_ugx - b.price_ugx);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price_ugx - a.price_ugx);
        break;
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      default:
        break;
    }
    
    setProperties(filtered);
  }, [filters, initialProperties]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <AdvancedPropertyFilters
          onFilter={setFilters}
          showCompact={false}
        />
      </div>

      {/* Properties Grid */}
      <div className="lg:col-span-3">
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">No properties match your filters</p>
              <button
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() =>
                  setFilters({
                    location: '',
                    priceMin: 0,
                    priceMax: 5000000,
                    bedrooms: '',
                    bathrooms: '',
                    category: '',
                    sortBy: 'newest',
                  })
                }
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}