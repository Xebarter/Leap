import React from 'react'
import { notFound } from 'next/navigation'
import { getPropertyById } from '@/lib/properties'
import PropertyDetailsContent from './property-details-content'

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams

  // Fetch property from database
  const property = await getPropertyById(id)

  // If property not found or not active, show 404
  if (!property || !property.is_active) {
    notFound()
  }

  return <PropertyDetailsContent property={property} id={id} />
}
