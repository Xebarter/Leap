import { createClient } from "@/lib/supabase/server"
import { TenantHeader } from "@/components/tenantView/tenant-header"
import { TenantComplaints } from "@/components/tenantView/tenant-complaints"
import { ComplaintForm } from "@/components/tenantView/forms/complaint-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TenantComplaintsPage() {
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
            <p className="text-muted-foreground">Please sign in to access your complaints.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </main>
      </div>
    )
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TenantHeader user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Complaints</h1>
              <p className="text-muted-foreground mt-2">File and track your complaints</p>
            </div>
            <ComplaintForm />
          </div>

          <Tabs defaultValue="open" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="open" className="rounded-lg px-6">
                Open ({openComplaints.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg px-6">
                All Complaints
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
      </main>
    </div>
  )
}
