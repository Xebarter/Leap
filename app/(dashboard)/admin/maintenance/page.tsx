import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/adminView/admin-sidebar";
import { AdminStats } from "@/components/adminView/admin-stats";
import { MaintenanceDashboard } from "@/components/adminView/maintenance-dashboard";

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

export default async function AdminMaintenancePage() {
  const supabase = await createClient();

  const [
    requestsResult,
    workOrdersResult,
    staffResult,
    assetsResult,
    propertiesResult
  ] = await Promise.all([
    safeSupabaseQuery(
      supabase
        .from("maintenance_requests")
        .select("*", { count: "exact" })
        .order("request_date", { ascending: false })
    ),
    safeSupabaseQuery(
      supabase
        .from("work_orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
    ),
    safeSupabaseQuery(
      supabase
        .from("maintenance_staff")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("maintenance_assets")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("properties")
        .select("*", { count: "exact" })
    )
  ]);

  const hasRequestsError = requestsResult.error?.message?.includes('Could not find the table');
  const hasWorkOrdersError = workOrdersResult.error?.message?.includes('Could not find the table');
  const hasStaffError = staffResult.error?.message?.includes('Could not find the table');
  const hasAssetsError = assetsResult.error?.message?.includes('Could not find the table');

  const finalRequests = hasRequestsError ? { data: [], count: 0 } : requestsResult;
  const finalWorkOrders = hasWorkOrdersError ? { data: [], count: 0 } : workOrdersResult;
  const finalStaff = hasStaffError ? { data: [], count: 0 } : staffResult;
  const finalAssets = hasAssetsError ? { data: [], count: 0 } : assetsResult;

  // Calculate maintenance statistics
  const openRequests = finalRequests.data?.filter((r: any) => r.status === 'open').length || 0;
  const inProgressRequests = finalRequests.data?.filter((r: any) => r.status === 'in_progress').length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Maintenance Management</h1>
            <p className="text-muted-foreground mt-1">Track maintenance requests, work orders, and assets</p>
          </div>

          <AdminStats
            totalProperties={propertiesResult.count || 0}
            totalBookings={finalWorkOrders.count || 0}
            totalUsers={finalStaff.count || 0}
            confirmedBookings={inProgressRequests}
            pendingBookings={openRequests}
          />

          <div className="mt-8">
            <MaintenanceDashboard
              requests={finalRequests.data || []}
              workOrders={finalWorkOrders.data || []}
              staff={finalStaff.data || []}
              assets={finalAssets.data || []}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
