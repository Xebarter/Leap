import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/adminView/admin-sidebar";
import { ComprehensiveTenantManager } from "@/components/adminView/comprehensive-tenant-manager";
import { TenantApplicationsManager } from "@/components/adminView/tenant-applications-manager";
import { AdminStats } from "@/components/adminView/admin-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to handle Supabase queries safely
async function safeSupabaseQuery(query: any) {
  try {
    const result = await query;
    // If the result has an error property that's an empty object, treat as a failure
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

export default async function AdminTenantsPage() {
  const supabase = await createClient();

  // Execute queries safely to prevent errors from breaking execution
  const [
    tenantsResult,
    propertiesResult,
    bookingsResult,
    confirmedBookingsResult,
    pendingBookingsResult,
    applicationsResult
  ] = await Promise.all([
    safeSupabaseQuery(
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, is_admin, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
    ),
    safeSupabaseQuery(
      supabase
        .from("properties")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("bookings")
        .select("*", { count: "exact" })
    ),
    safeSupabaseQuery(
      supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .eq("status", "confirmed")
    ),
    safeSupabaseQuery(
      supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .eq("status", "pending")
    ),
    safeSupabaseQuery(
      supabase
        .from("tenant_applications")
        .select(`
          *,
          properties (
            id,
            title,
            location
          )
        `, { count: "exact" })
        .order("submitted_at", { ascending: false })
    )
  ]);

  // Check if the profiles table exists by checking the specific error or access denied
  const hasTableNotFoundError = tenantsResult.error?.message?.includes('Could not find the table') || 
                               tenantsResult.error?.message?.includes('profiles') ||
                               tenantsResult.error?.message?.includes('Access denied');

  // Check if there's an error with any of the queries, but only log if it's not one of the expected errors
  if (tenantsResult.error && !hasTableNotFoundError) {
    try {
      console.warn("Tenants error:", tenantsResult.error);
    } catch (e) {
      // Silently ignore logging errors
    }
  }

  // If there's a table not found error, use mock data
  const finalTenantsResult = hasTableNotFoundError 
    ? { 
        data: [], 
        count: 0 
      } 
    : tenantsResult;

  // Calculate additional tenant-related stats
  const totalTenants = finalTenantsResult.count || 0;
  const totalProperties = propertiesResult.count || 0;
  const totalBookings = bookingsResult.count || 0;
  const confirmedBookings = confirmedBookingsResult.count || 0;
  const pendingBookings = pendingBookingsResult.count || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
            <p className="text-muted-foreground mt-1">Manage your registered tenants and their information</p>
          </div>

          <AdminStats 
            totalProperties={totalProperties} 
            totalBookings={totalBookings} 
            totalUsers={totalTenants}
            confirmedBookings={confirmedBookings}
            pendingBookings={pendingBookings}
          />

          <div className="mt-8">
            <Tabs defaultValue="tenants" className="space-y-6">
              <TabsList>
                <TabsTrigger value="tenants">
                  Registered Tenants ({totalTenants})
                </TabsTrigger>
                <TabsTrigger value="applications">
                  Applications ({applicationsResult.count || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tenants" className="space-y-6">
                <ComprehensiveTenantManager initialTenants={finalTenantsResult.data || []} />
              </TabsContent>
              
              <TabsContent value="applications" className="space-y-6">
                <TenantApplicationsManager initialApplications={applicationsResult.data || []} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}