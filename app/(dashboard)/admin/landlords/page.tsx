import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { ComprehensiveLandlordManager } from "@/components/adminView/comprehensive-landlord-manager"
import { redirect } from "next/navigation"

export default async function LandlordsPage() {
  const supabase = await createClient()

  // Check if user is authenticated and is an admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin && profile?.role !== "admin") {
    redirect("/")
  }

  // Fetch all landlords with their profile information
  const { data: landlords, error } = await supabase
    .from("landlord_profiles")
    .select(`
      *,
      profiles:user_id (
        full_name,
        email,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching landlords:", error)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Landlord Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage property owners, verify accounts, and track commissions
            </p>
          </div>
        </div>

        <ComprehensiveLandlordManager initialLandlords={landlords || []} />
      </main>
    </div>
  )
}
