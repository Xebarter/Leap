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
      <Card className="overflow-hidden border-2 border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 hover:border-amber-300 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative">
        {/* Premium Badge */}
        <div className="absolute top-4 left-4 z-20">
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1.5">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold text-xs">FEATURED</span>
          </Badge>
        </div>

        {/* Sparkle Effect */}
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
        </div>

        {/* Image Container */}
        <div className="relative h-64 sm:h-72 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
              <div className="text-center">
                <Crown className="h-12 w-12 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-600 font-medium">Premium Property</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          
          {/* Property Code */}
          {property.property_code && (
            <div className="absolute bottom-4 left-4 z-10">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-900 font-mono text-xs border-0 shadow-md">
                {property.property_code}
              </Badge>
            </div>
          )}
          
          {/* Category Badge */}
          {property.category && (
            <div className="absolute bottom-4 right-4 z-10">
              <Badge variant="secondary" className="bg-primary/90 backdrop-blur-sm text-white text-xs border-0 shadow-md capitalize">
                {property.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 bg-gradient-to-br from-white via-amber-50/20 to-white">
          {/* Title and Location */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors duration-300">
              {property.title}
            </h3>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{property.location}</span>
            </div>
          </div>

          {/* Price - Prominent */}
          <div className="py-3 px-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-700">
                UGX {formatPrice(property.price_ugx)}
              </span>
            </div>
            <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">per month</span>
          </div>

          {/* Features with Icons */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-50/50 rounded-lg border border-slate-200/50">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <Bed className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium">Bedrooms</p>
                <p className="text-sm font-bold text-slate-900">{property.bedrooms}</p>
              </div>
            </div>
            
            <div className="w-px h-10 bg-slate-200" />
            
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <Bath className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium">Bathrooms</p>
                <p className="text-sm font-bold text-slate-900">{property.bathrooms}</p>
              </div>
            </div>
            
            {property.area && (
              <>
                <div className="w-px h-10 bg-slate-200" />
                
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    <Square className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">Area</p>
                    <p className="text-sm font-bold text-slate-900">{property.area}m²</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Premium CTA */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg text-white group-hover:from-amber-600 group-hover:to-amber-700 transition-all duration-300 shadow-lg group-hover:shadow-xl">
              <span className="font-semibold text-sm">View Premium Details</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-amber-200/50">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs text-slate-600 font-medium">Premium Verified</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs text-slate-600 font-medium">Quality Assured</span>
            </div>
          </div>
        </div>

        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full pointer-events-none" />
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
