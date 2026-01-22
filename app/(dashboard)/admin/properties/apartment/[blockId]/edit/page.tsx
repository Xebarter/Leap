'use client'

import { useParams } from 'next/navigation'
import { ApartmentEditor } from '@/components/adminView/apartment-editor'
import { AdminSidebar } from '@/components/adminView/admin-sidebar'

export default function EditApartmentPage() {
  const params = useParams()
  const blockId = params.blockId as string

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <ApartmentEditor blockId={blockId} isNew={false} />
      </main>
    </div>
  )
}
