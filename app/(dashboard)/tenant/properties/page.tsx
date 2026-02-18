import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MyPropertiesManager } from "@/components/tenantView/my-properties-manager"

export default async function MyPropertiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch tenant's active and past occupancies
  const { data: occupancies, error } = await supabase
    .from("property_occupancy_history")
    .select(`
      id,
      property_id,
      tenant_id,
      start_date,
      end_date,
      months_paid,
      amount_paid_ugx,
      status,
      created_at,
      properties (
        id,
        title,
        location,
        image_url,
        price_ugx,
        property_type,
        description,
        bedrooms,
        bathrooms,
        landlord_id,
        profiles:landlord_id (
          id,
          full_name,
          email,
          phone
        )
      )
    `)
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false })

  console.log('My Properties - Occupancies:', occupancies)
  console.log('My Properties - Error:', error)

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Properties</h2>
          <p className="text-muted-foreground mt-2">
            Manage your rented properties and all related activities
          </p>
        </div>
      </div>

      <MyPropertiesManager 
        initialOccupancies={occupancies || []} 
        userId={user.id}
      />
    </div>
  )
}
