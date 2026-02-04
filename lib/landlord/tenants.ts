import { createClient } from "@/lib/supabase/server"
import {
  getLandlordBookings,
  getLandlordComplaints,
  getLandlordInvoices,
  getLandlordMaintenanceRequests,
  getLandlordPaymentTransactions,
} from "@/lib/landlord/queries"

export type LandlordTenantDetails = {
  tenantId: string
  fullName: string
  email: string
  phoneNumber?: string | null
  tenantNumber?: string | null
  verificationStatus?: string | null

  activeBookingsCount: number
  totalBookingsCount: number

  totalPaidUgx: number
  outstandingUgx: number
  lastPaymentDate?: string | null

  bookings: any[]
  invoices: any[]
  payments: any[]

  complaints: any[]
  maintenance: any[]
  documents: any[]
}

function getDisplayNameFromProfile(p: any) {
  return p?.full_name || p?.email || "Tenant"
}

export async function getLandlordTenants(propertyIds: string[]): Promise<LandlordTenantDetails[]> {
  if (propertyIds.length === 0) return []

  const supabase = await createClient()

  const [bookings, invoices, payments, complaints, maintenance] = await Promise.all([
    getLandlordBookings(propertyIds),
    getLandlordInvoices(propertyIds),
    getLandlordPaymentTransactions(propertyIds),
    getLandlordComplaints(propertyIds),
    getLandlordMaintenanceRequests(propertyIds),
  ])

  const tenantIds = Array.from(new Set(bookings.map((b) => b.tenant_id).filter(Boolean)))

  // Best-effort: enrich with tenant_profiles info (tenant_number, verification_status)
  // Some deployments may not have RLS allowing landlord read; handle errors gracefully.
  let tenantProfilesByUserId = new Map<string, any>()
  if (tenantIds.length > 0) {
    const { data, error } = await supabase
      .from("tenant_profiles")
      .select("id,user_id,tenant_number,verification_status")
      .in("user_id", tenantIds)

    if (!error && data) {
      tenantProfilesByUserId = new Map(data.map((tp: any) => [tp.user_id, tp]))
    }
  }

  // Best-effort: tenant documents (many DBs only allow tenant/admin. If RLS blocks it, we just skip.)
  let documents: any[] = []
  const tenantProfileIds = Array.from(tenantProfilesByUserId.values())
    .map((tp: any) => tp.id)
    .filter(Boolean)

  if (tenantProfileIds.length > 0) {
    const { data, error } = await supabase
      .from("tenant_documents")
      .select("id,tenant_profile_id,document_type,document_name,document_url,status,expiry_date,created_at")
      .in("tenant_profile_id", tenantProfileIds)
      .order("created_at", { ascending: false })

    if (!error && data) documents = data
  }

  const byTenant = new Map<string, LandlordTenantDetails>()

  for (const b of bookings) {
    const tenantId = b.tenant_id
    if (!tenantId) continue

    const profile = b.profiles
    const tp = tenantProfilesByUserId.get(tenantId)

    const existing = byTenant.get(tenantId)
    if (!existing) {
      byTenant.set(tenantId, {
        tenantId,
        fullName: getDisplayNameFromProfile(profile),
        email: profile?.email || "",
        phoneNumber: profile?.phone_number || null,
        tenantNumber: tp?.tenant_number || null,
        verificationStatus: tp?.verification_status || null,

        activeBookingsCount: 0,
        totalBookingsCount: 0,

        totalPaidUgx: 0,
        outstandingUgx: 0,
        lastPaymentDate: null,

        bookings: [],
        invoices: [],
        payments: [],

        complaints: [],
        maintenance: [],
        documents: [],
      })
    }

    const t = byTenant.get(tenantId)!
    t.bookings.push(b)
    t.totalBookingsCount += 1
    if (["active", "confirmed"].includes(b.status)) t.activeBookingsCount += 1
  }

  for (const inv of invoices) {
    const tenantId = inv.tenant_id
    if (!tenantId) continue
    const t = byTenant.get(tenantId)
    if (!t) continue

    t.invoices.push(inv)

    if (["sent", "overdue", "partially_paid"].includes(inv.status)) {
      t.outstandingUgx += inv.amount_balance_ugx || 0
    }
  }

  for (const p of payments) {
    const tenantId = p.tenant_id
    if (!tenantId) continue
    const t = byTenant.get(tenantId)
    if (!t) continue

    t.payments.push(p)
    if (p.status === "completed") t.totalPaidUgx += p.amount_paid_ugx || 0

    const dt = p.payment_date ? new Date(p.payment_date).getTime() : 0
    const current = t.lastPaymentDate ? new Date(t.lastPaymentDate).getTime() : 0
    if (dt > current) t.lastPaymentDate = p.payment_date
  }

  for (const c of complaints) {
    const tenantId = c.tenant_id
    if (!tenantId) continue
    const t = byTenant.get(tenantId)
    if (!t) continue
    t.complaints.push(c)
  }

  for (const m of maintenance) {
    const tenantId = m.tenant_id
    if (!tenantId) continue
    const t = byTenant.get(tenantId)
    if (!t) continue
    t.maintenance.push(m)
  }

  // Attach documents by tenant_profile_id mapping
  if (documents.length > 0) {
    const tenantProfileIdToUserId = new Map<string, string>()
    for (const [userId, tp] of tenantProfilesByUserId.entries()) {
      if (tp?.id) tenantProfileIdToUserId.set(tp.id, userId)
    }

    for (const d of documents) {
      const userId = tenantProfileIdToUserId.get(d.tenant_profile_id)
      if (!userId) continue
      const t = byTenant.get(userId)
      if (!t) continue
      t.documents.push(d)
    }
  }

  // Sort: outstanding first, then name
  return Array.from(byTenant.values()).sort((a, b) => {
    if (a.outstandingUgx !== b.outstandingUgx) return b.outstandingUgx - a.outstandingUgx
    return a.fullName.localeCompare(b.fullName)
  })
}
