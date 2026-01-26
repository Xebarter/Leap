import { createClient } from "@/lib/supabase/server"
import { MaintenanceRequests } from "@/components/tenantView/maintenance-requests"
import { MaintenanceRequestForm } from "@/components/tenantView/forms/maintenance-request-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"

export default async function TenantMaintenancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch maintenance requests
  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("tenant_id", user.id)
    .order("request_date", { ascending: false })

  // Fetch open requests
  const openRequests = requests?.filter((r) => ["open", "assigned", "in_progress"].includes(r.status)) || []

  // Fetch completed requests
  const completedRequests = requests?.filter((r) => r.status === "completed") || []

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-2">Request and track maintenance issues</p>
        </div>
        <MaintenanceRequestForm />
      </div>

      <Tabs defaultValue="open" className="space-y-6 md:space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="open" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            <span className="hidden sm:inline">Open Requests</span>
            <span className="sm:hidden">Open</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-6">
          <MaintenanceRequests requests={openRequests} />
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <MaintenanceRequests requests={requests || []} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <MaintenanceRequests requests={completedRequests} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
