'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyCard } from '../publicView/property-card';

// Define the Property interface to match the data structure from the API
interface Property {
  id: string
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

export function HeroSection() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        
        if (data.properties) {
          // Take only the first 3 properties as featured
          setProperties(data.properties.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <h1 className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></h1>
            <p className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></p>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect <span className="text-primary">Home</span> Today
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover and book your ideal property from our curated selection of premium homes
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/properties">Browse Properties</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/how-it-works">Learn More</a>
            </Button>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.length > 0 ? (
              properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No featured properties available at the moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}