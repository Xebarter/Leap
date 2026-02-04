import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandlordMaintenanceComplaints } from "@/components/landlordView/landlord-maintenance-complaints"
import {
  getLandlordComplaints,
  getLandlordMaintenanceRequests,
  getLandlordProperties,
} from "@/lib/landlord/queries"

export default async function LandlordMaintenancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: landlordProfile } = await supabase
    .from("landlord_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  const properties = await getLandlordProperties({ userId: user.id, landlordProfileId: landlordProfile?.id ?? null })
  const propertyIds = properties.map((p) => p.id)

  const [complaints, maintenance] = await Promise.all([
    getLandlordComplaints(propertyIds),
    getLandlordMaintenanceRequests(propertyIds),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Complaints & Maintenance</h1>
        <p className="text-muted-foreground mt-2">Track issues raised across your properties.</p>
      </div>

      <LandlordMaintenanceComplaints complaints={complaints} maintenance={maintenance} />
    </div>
  )
}
