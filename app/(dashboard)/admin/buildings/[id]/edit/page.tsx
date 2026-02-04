'use client'

import { useParams } from 'next/navigation'
import { ApartmentEditor } from '@/components/adminView/apartment-editor'
import { AdminSidebar } from '@/components/adminView/admin-sidebar'

export default function EditBuildingPage() {
  const params = useParams()
  const buildingId = params.id as string

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <ApartmentEditor blockId={buildingId} isNew={false} />
      </main>
    </div>
  )
}
