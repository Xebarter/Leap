import React, { Suspense } from 'react'
import { getPublicProperties } from '@/lib/properties'
import PropertiesPageContent from './properties-content'

interface PropertyItem {
  id: string
  property_code?: string
  title: string
  location: string
  price_ugx: number
  bedrooms: number
  bathrooms: number
  image_url: string | null
}

export default async function PropertiesPage() {
  // Fetch properties from database
  let properties: PropertyItem[] = []
  
  try {
    console.log('PropertiesPage: Fetching properties...')
    const dbProperties = await getPublicProperties()
    console.log('PropertiesPage: Got', dbProperties?.length || 0, 'properties')
    
    // Transform to the format needed by the component
    if (dbProperties && Array.isArray(dbProperties)) {
      properties = dbProperties.map(prop => ({
        id: prop.id,
        property_code: prop.property_code,
        title: prop.title,
        location: prop.location,
        price_ugx: prop.price_ugx,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        image_url: prop.image_url,
      }))
    }
  } catch (err) {
    console.error('Failed to fetch properties in PropertiesPage:', err)
    // Return empty array - page will still render
    properties = []
  }
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PropertiesPageContent initialProperties={properties} />
    </Suspense>
  )
}
