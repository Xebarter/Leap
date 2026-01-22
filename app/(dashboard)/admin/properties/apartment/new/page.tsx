'use client'

import { ApartmentEditor } from '@/components/adminView/apartment-editor'
import { AdminSidebar } from '@/components/adminView/admin-sidebar'

export default function NewApartmentPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <ApartmentEditor isNew={true} />
      </main>
    </div>
  )
}
