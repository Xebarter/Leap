import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandlordPropertiesTable } from "@/components/landlordView/landlord-properties-table"
import { getLandlordProperties } from "@/lib/landlord/queries"

export default async function LandlordPropertiesPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Properties</h1>
        <p className="text-muted-foreground mt-2">View your properties and basic performance.</p>
      </div>

      <LandlordPropertiesTable properties={properties} />
    </div>
  )
}
