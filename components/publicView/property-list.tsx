'use client';

import { useState, useEffect } from 'react';
import { PropertyCard } from './property-card';

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

interface PropertyListProps {
  initialProperties: Property[];
}

export function PropertyList({ initialProperties }: PropertyListProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [loading, setLoading] = useState(false);

  // In a real application, you would fetch updated properties here
  // This is just an example of how you might handle dynamic updates
  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No properties available</h3>
        <p className="text-muted-foreground mt-1">Check back later for new listings</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}