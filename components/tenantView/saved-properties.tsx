"use client"

import { PropertyCard } from "../publicView/property-card"

export function SavedProperties({ favorites }: { favorites: any[] }) {
  if (favorites.length === 0) {
    return (
      <div className="p-20 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-lg mb-4">You haven't saved any properties yet.</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Heart a property to keep track of it here for later consideration.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {favorites.map((fav) => (
        <PropertyCard key={fav.id} property={fav.properties} />
      ))}
    </div>
  )
}
