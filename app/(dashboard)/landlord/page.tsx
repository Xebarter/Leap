import { createClient } from "@/lib/supabase/server"
import { LandlordOverview } from "@/components/landlordView/landlord-overview"
import {
  getLandlordBookings,
  getLandlordComplaints,
  getLandlordInvoices,
  getLandlordMaintenanceRequests,
  getLandlordPaymentTransactions,
  getLandlordProperties,
  getLandlordUnits,
} from "@/lib/landlord/queries"

function toLandlordScope(userId: string, landlordProfile: any | null) {
  return { userId, landlordProfileId: landlordProfile?.id ?? null }
}

export default async function LandlordDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: landlordProfile } = await supabase
    .from("landlord_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  const scope = toLandlordScope(user.id, landlordProfile)

  const properties = await getLandlordProperties(scope)
  const propertyIds = properties.map((p) => p.id)

  const [units, bookings, invoices, payments, complaints, maintenance] = await Promise.all([
    getLandlordUnits(propertyIds),
    getLandlordBookings(propertyIds),
    getLandlordInvoices(propertyIds),
    getLandlordPaymentTransactions(propertyIds),
    getLandlordComplaints(propertyIds),
    getLandlordMaintenanceRequests(propertyIds),
  ])

  const unitsCount = units.length
  const occupiedUnitsCount = units.filter((u) => !u.is_available).length
  const occupancyRate = unitsCount > 0 ? `${Math.round((occupiedUnitsCount / unitsCount) * 100)}%` : "0%"

  const now = Date.now()
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  const revenueMonthUgx = payments
    .filter((p) => (p.payment_date ? new Date(p.payment_date).getTime() : 0) >= monthAgo)
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount_paid_ugx || 0), 0)

  const overdueInvoicesCount = invoices.filter((i) => i.status === "overdue").length
  const openComplaintsCount = complaints.filter((c) => ["open", "in_progress", "pending_review"].includes(c.status)).length
  const openMaintenanceCount = maintenance.filter((m) => ["open", "assigned", "in_progress", "on_hold"].includes(m.status)).length

  return (
    <LandlordOverview
      stats={{
        propertiesCount: properties.length,
        unitsCount,
        occupiedUnitsCount,
        occupancyRate,
        revenueMonthUgx,
        overdueInvoicesCount,
        openComplaintsCount,
        openMaintenanceCount,
      }}
      recentUnits={units.slice(0, 10)}
      recentTenancies={bookings.slice(0, 10)}
      recentPayments={payments.slice(0, 10)}
      recentComplaints={complaints.slice(0, 10)}
      recentMaintenance={maintenance.slice(0, 10)}
    />
  )
}
