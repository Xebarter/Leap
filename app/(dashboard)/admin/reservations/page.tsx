import { createClient } from "@/lib/supabase/server"
import { ReservationsManager } from "@/components/adminView/reservations-manager"

export const metadata = {
  title: "Reservations | Admin Dashboard",
  description: "Manage property reservations",
}

export default async function ReservationsPage() {
  const supabase = await createClient()

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Reservations</h1>
        <p className="text-muted-foreground">
          Manage and track all property reservations
        </p>
      </div>

      <ReservationsManager initialReservations={reservations || []} />
    </div>
  )
}
