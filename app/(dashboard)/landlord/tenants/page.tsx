import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getLandlordProperties } from "@/lib/landlord/queries"
import { getLandlordTenants } from "@/lib/landlord/tenants"
import { LandlordTenantsBrowser } from "@/components/landlordView/landlord-tenants-browser"

export default async function LandlordTenantsPage() {
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
  const tenants = await getLandlordTenants(properties.map((p) => p.id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground mt-2">
          Select a tenant to view their details and payment history for your properties.
        </p>
      </div>

      <LandlordTenantsBrowser tenants={tenants} />
    </div>
  )
}
