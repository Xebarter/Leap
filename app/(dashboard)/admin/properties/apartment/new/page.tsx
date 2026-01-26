'use client'

import { ApartmentEditor } from '@/components/adminView/apartment-editor'
import { AdminSidebar } from '@/components/adminView/admin-sidebar'
import { useSearchParams } from 'next/navigation'

export default function NewApartmentPage() {
  const searchParams = useSearchParams()
  const buildingType = searchParams.get('type') || 'apartment' // 'apartment', 'hostel', or 'office'
  
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <ApartmentEditor isNew={true} buildingType={buildingType} />
      </main>
    </div>
  )
}
