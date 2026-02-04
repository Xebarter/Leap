import { createClient } from "@/lib/supabase/server"

export type LandlordScope = {
  userId: string
  landlordProfileId?: string | null
}

/**
 * Returns property rows for a landlord.
 * Supports both schemas:
 * - properties.host_id (core schema + RLS policies)
 * - properties.landlord_id (landlord_profiles.id)
 */
export async function getLandlordProperties(scope: LandlordScope) {
  const supabase = await createClient()

  const baseSelect = "id,title,location,image_url,price_ugx,is_active,created_at,host_id,landlord_id"

  // If landlordProfileId exists, include landlord_id match, otherwise only host_id.
  const query = scope.landlordProfileId
    ? supabase
        .from("properties")
        .select(baseSelect)
        .or(`host_id.eq.${scope.userId},landlord_id.eq.${scope.landlordProfileId}`)
    : supabase.from("properties").select(baseSelect).eq("host_id", scope.userId)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordPropertyIds(scope: LandlordScope) {
  const properties = await getLandlordProperties(scope)
  return properties.map((p) => p.id)
}

export async function getLandlordUnits(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  const { data, error } = await supabase
    .from("property_units")
    .select("id,property_id,block_id,floor_number,unit_number,bedrooms,bathrooms,unit_type,is_available,price_ugx,created_at")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordBookings(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,property_id,unit_id,tenant_id,check_in,check_out,total_price_ugx,status,created_at,profiles:tenant_id(id,full_name,email,phone_number)"
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordComplaints(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  const { data, error } = await supabase
    .from("tenant_complaints")
    .select(
      "id,property_id,booking_id,tenant_id,complaint_type,title,description,status,priority,created_at,profiles:tenant_id(id,full_name,email)"
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordMaintenanceRequests(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(
      "id,property_id,booking_id,tenant_id,request_number,title,description,status,severity,request_date,due_date,created_at,profiles:tenant_id(id,full_name,email)"
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordInvoices(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,invoice_number,property_id,tenant_id,booking_id,invoice_date,due_date,total_amount_ugx,amount_paid_ugx,amount_balance_ugx,status,created_at,profiles:tenant_id(id,full_name,email)"
    )
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLandlordPaymentTransactions(propertyIds: string[]) {
  const supabase = await createClient()
  if (propertyIds.length === 0) return []

  // Payment transactions don't have property_id directly; join via bookings.
  // We fetch via booking_ids of landlord properties.
  const bookings = await getLandlordBookings(propertyIds)
  const bookingIds = bookings.map((b) => b.id)
  if (bookingIds.length === 0) return []

  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      "id,transaction_id,invoice_id,booking_id,tenant_id,amount_paid_ugx,currency,payment_date,payment_method,provider,status,description,created_at,profiles:tenant_id(id,full_name,email)"
    )
    .in("booking_id", bookingIds)
    .order("payment_date", { ascending: false })

  if (error) throw error
  return data ?? []
}
