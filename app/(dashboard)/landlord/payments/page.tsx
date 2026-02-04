import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LandlordPaymentsTable } from "@/components/landlordView/landlord-payments-table"
import {
  getLandlordInvoices,
  getLandlordPaymentTransactions,
  getLandlordProperties,
} from "@/lib/landlord/queries"

export default async function LandlordPaymentsPage() {
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

  const [payments, invoices] = await Promise.all([
    getLandlordPaymentTransactions(propertyIds),
    getLandlordInvoices(propertyIds),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments & Reports</h1>
        <p className="text-muted-foreground mt-2">Payment transactions and invoices for your properties.</p>
      </div>

      <LandlordPaymentsTable payments={payments} invoices={invoices} />
    </div>
  )
}
