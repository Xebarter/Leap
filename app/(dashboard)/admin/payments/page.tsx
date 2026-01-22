import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/adminView/admin-sidebar";
import { AdminStats } from "@/components/adminView/admin-stats";
import { PaymentsDashboard } from "@/components/adminView/payments-dashboard";

async function safeSupabaseQuery(query: any) {
  try {
    const result = await query;
    if (result.error && typeof result.error === 'object' && Object.keys(result.error).length === 0) {
      console.warn("Query failed with empty error object - likely RLS issue");
      return { data: [], count: 0, error: { message: "Access denied or table not found" } };
    }
    return result;
  } catch (error: any) {
    console.error("Supabase query error:", error);
    return { data: [], count: 0, error };
  }
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const [
    invoicesResult,
    paymentsResult,
    refundsResult,
    propertiesResult,
    tenantsResult
  ] = await Promise.all([
    safeSupabaseQuery(
      supabase
        .from("invoices")
        .select("*", { count: "exact" })
        .order("invoice_date", { ascending: false })
    ),
    safeSupabaseQuery(
      supabase
        .from("payment_transactions")
        .select("*", { count: "exact" })
        .eq("status", "completed")
    ),
    safeSupabaseQuery(
      supabase
        .from("refunds")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("properties")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("profiles")
        .select("*", { count: "exact" })
    )
  ]);

  const hasInvoicesError = invoicesResult.error?.message?.includes('Could not find the table');
  const hasPaymentsError = paymentsResult.error?.message?.includes('Could not find the table');
  const hasRefundsError = refundsResult.error?.message?.includes('Could not find the table');

  const finalInvoices = hasInvoicesError ? { data: [], count: 0 } : invoicesResult;
  const finalPayments = hasPaymentsError ? { data: [], count: 0 } : paymentsResult;
  const finalRefunds = hasRefundsError ? { data: [], count: 0 } : refundsResult;

  // Calculate payment statistics
  const totalRevenue = finalPayments.data?.reduce((sum: number, p: any) => sum + (p.amount_paid_ugx || 0), 0) || 0;
  const overdueInvoices = finalInvoices.data?.filter((i: any) => i.status === 'overdue').length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Payments Management</h1>
            <p className="text-muted-foreground mt-1">Track invoices, payments, and refunds</p>
          </div>

          <AdminStats
            totalProperties={propertiesResult.count || 0}
            totalBookings={finalInvoices.count || 0}
            totalUsers={tenantsResult.count || 0}
            confirmedBookings={finalPayments.count || 0}
            pendingBookings={overdueInvoices}
          />

          <div className="mt-8">
            <PaymentsDashboard
              invoices={finalInvoices.data || []}
              payments={finalPayments.data || []}
              refunds={finalRefunds.data || []}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
