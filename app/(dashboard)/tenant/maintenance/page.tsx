import { createClient } from "@/lib/supabase/server"
import { TenantHeader } from "@/components/tenantView/tenant-header"
import { MaintenanceRequests } from "@/components/tenantView/maintenance-requests"
import { MaintenanceRequestForm } from "@/components/tenantView/forms/maintenance-request-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TenantMaintenancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <TenantHeader user={{ email: "guest@example.com", user_metadata: { full_name: "Guest" } }} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <p className="text-muted-foreground">Please sign in to access maintenance requests.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </main>
      </div>
    )
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TenantHeader user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Maintenance</h1>
              <p className="text-muted-foreground mt-2">Request and track maintenance issues</p>
            </div>
            <MaintenanceRequestForm />
          </div>

          <Tabs defaultValue="open" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="open" className="rounded-lg px-6">
                Open Requests
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg px-6">
                All Requests
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6">
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
      </main>
    </div>
  )
}
