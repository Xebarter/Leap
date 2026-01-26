import { createClient } from "@/lib/supabase/server"
import { TenantNotices } from "@/components/tenantView/tenant-notices"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"

export default async function TenantNoticesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground mt-2">Important notices and communications from management</p>
      </header>

      <Tabs defaultValue="unread" className="space-y-6 md:space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="unread" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            Unread ({unreadNotices.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
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
  )
}
