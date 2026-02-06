import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { ReservationsManager } from "@/components/adminView/reservations-manager"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Reservations | Admin Dashboard",
  description: "Manage property reservations",
}

export default async function ReservationsPage() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // If no user, redirect to login
  if (!user) {
    redirect('/auth/login')
  }

  // Verify user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin || profile?.role === 'admin'

  if (!isAdmin) {
    redirect('/tenant')
  }

  // Fetch all reservations with related data
  const { data: reservations, error } = await supabase
    .from("property_reservations")
    .select(`
      *,
      properties (
        id,
        title,
        location,
        price_ugx
      ),
      profiles!property_reservations_tenant_id_fkey (
        id,
        full_name,
        email,
        phone
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reservations:", error)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Property Reservations</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all property reservations
            </p>
          </div>

          <ReservationsManager initialReservations={reservations || []} />
        </div>
      </main>
    </div>
  )
}
