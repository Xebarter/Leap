import { createClient } from "@/lib/supabase/server"
import { TenantHeader } from "@/components/tenantView/tenant-header"
import { TenantNotices } from "@/components/tenantView/tenant-notices"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TenantNoticesPage() {
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
            <p className="text-muted-foreground">Please sign in to access your notices.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </main>
      </div>
    )
  }

  // Fetch notices
  const { data: notices } = await supabase
    .from("tenant_notices")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false })

  // Filter unread notices
  const unreadNotices = notices?.filter((n) => n.status === "sent") || []

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TenantHeader user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Notices</h1>
            <p className="text-muted-foreground mt-2">Important notices and communications from management</p>
          </header>

          <Tabs defaultValue="unread" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="unread" className="rounded-lg px-6">
                Unread ({unreadNotices.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg px-6">
                All Notices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="space-y-6">
              <TenantNotices notices={unreadNotices} />
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              <TenantNotices notices={notices || []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
