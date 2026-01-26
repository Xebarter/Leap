import { createClient } from "@/lib/supabase/server"
import { TenantComplaints } from "@/components/tenantView/tenant-complaints"
import { ComplaintForm } from "@/components/tenantView/forms/complaint-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"

export default async function TenantComplaintsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch complaints
  const { data: complaints } = await supabase
    .from("tenant_complaints")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false })

  // Filter open complaints
  const openComplaints = complaints?.filter((c) => ["open", "in_progress", "pending_review"].includes(c.status)) || []

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Complaints</h1>
          <p className="text-muted-foreground mt-2">File and track your complaints</p>
        </div>
        <ComplaintForm />
      </div>

      <Tabs defaultValue="open" className="space-y-6 md:space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="open" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            Open ({openComplaints.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            <span className="hidden sm:inline">All Complaints</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-6">
          <TenantComplaints complaints={openComplaints} />
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <TenantComplaints complaints={complaints || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
