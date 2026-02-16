'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Bed, Bath, Square, MapPin, Star, Sparkles, ArrowRight, Crown } from 'lucide-react'

interface FeaturedPropertyCardProps {
  property: {
    id: string
    title: string
    location: string
    price_ugx: number
    bedrooms: number
    bathrooms: number
    area?: number
    image_url: string | null
    property_code?: string
    category?: string
  }
}

export function FeaturedPropertyCard({ property }: FeaturedPropertyCardProps) {
  // Format price with commas
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG').format(price)
  }

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <Card className="overflow-hidden border border-slate-200 hover:border-amber-400/50 bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative h-full">
        {/* Premium Badge - Subtle */}
        <div className="absolute top-3 left-3 z-20">
          <Badge className="bg-amber-500 text-white border-0 shadow-md px-2 py-0.5 text-xs font-semibold">
            FEATURED
          </Badge>
        </div>

        {/* Image Container - Compact */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
              <Star className="h-10 w-10 text-slate-300" />
            </div>
          )}
          
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Property Code - Bottom Left */}
          {property.property_code && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-slate-700 font-mono text-xs border-0 shadow-sm">
                {property.property_code}
              </Badge>
            </div>
          )}
          
          {/* Category Badge - Top Right */}
          {property.category && (
            <div className="absolute top-3 right-3 z-10">
              <Badge variant="secondary" className="bg-slate-900/80 backdrop-blur-sm text-white text-xs border-0 capitalize">
                {property.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Content - Compact */}
        <div className="p-4 space-y-3">
          {/* Title and Location */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{property.location}</span>
            </div>
          </div>

          {/* Price - Clean Design */}
          <div className="py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-amber-700">
                  UGX {formatPrice(property.price_ugx / 100)}
                </span>
                <span className="text-xs text-amber-600 ml-2">/ month</span>
              </div>
            </div>
          </div>

          {/* Features - Compact Grid */}
          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
              <Bed className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-xs font-semibold text-slate-900">{property.bedrooms}</span>
              <span className="text-xs text-slate-500">Beds</span>
            </div>
            
            <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
              <Bath className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-xs font-semibold text-slate-900">{property.bathrooms}</span>
              <span className="text-xs text-slate-500">Baths</span>
            </div>
            
            {property.area ? (
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Square className="w-4 h-4 text-amber-600 mb-1" />
                <span className="text-xs font-semibold text-slate-900">{property.area}m²</span>
                <span className="text-xs text-slate-500">Area</span>
              </div>
            ) : (
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Star className="w-4 h-4 text-amber-500 mb-1 fill-amber-500" />
                <span className="text-xs font-semibold text-slate-900">Top</span>
                <span className="text-xs text-slate-500">Rated</span>
              </div>
            )}
          </div>

          {/* Trust Badge - Compact */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600 font-medium">Verified</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function Shield({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
