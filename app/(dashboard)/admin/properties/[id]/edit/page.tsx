"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PropertyEditor } from "@/components/adminView/property-editor"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { Loader2 } from "lucide-react"

export default function PropertyEditPage() {
  const params = useParams()
  const propertyId = params.id as string
  const isNewProperty = propertyId === "new"
  
  const [blocks, setBlocks] = useState<any[]>([])
  const [blocksLoading, setBlocksLoading] = useState(true)

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('property_blocks')
        .select('id, name, location')
        .order('created_at', { ascending: false })
      
      if (data) setBlocks(data)
    } catch (err) {
      console.error('Error loading blocks:', err)
    } finally {
      setBlocksLoading(false)
    }
  }

  if (blocksLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <PropertyEditor
          propertyId={isNewProperty ? undefined : propertyId}
          blocks={blocks}
          isNew={isNewProperty}
        />
      </main>
    </div>
  )
}
