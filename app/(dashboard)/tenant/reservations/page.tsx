import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TenantReservationsView } from "@/components/tenantView/tenant-reservations"
import { Suspense } from "react"
import { ReservationPageSkeleton } from "@/components/tenantView/reservation-skeleton"

export const metadata = {
  title: "My Reservations | Tenant Dashboard",
  description: "View and manage your property reservations",
}

export default async function TenantReservationsPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch tenant's reservations
  const { data: reservations, error } = await supabase
    .from("property_reservations")
    .select(`
      *,
      properties (
        id,
        title,
        location,
        price_ugx,
        description
      )
    `)
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reservations:", error)
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent rounded-lg blur-3xl -z-10" />
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-purple-600 bg-clip-text text-transparent">
          My Reservations
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          View and manage your property reservations
        </p>
      </div>

      <Suspense fallback={<ReservationPageSkeleton />}>
        <TenantReservationsView reservations={reservations || []} />
      </Suspense>
    </div>
  )
}
