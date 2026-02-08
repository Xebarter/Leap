import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/adminView/admin-sidebar";
import { ComprehensivePropertyManager } from "@/components/adminView/comprehensive-property-manager";
import { AdminStats } from "@/components/adminView/admin-stats";

// Helper function to get access token for API calls
async function getAccessToken(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

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

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Log user info for debugging
  console.log('=== Server-side user check ===');
  console.log('User:', user?.id);
  console.log('User error:', userError);
  
  // If no user, redirect to login
  if (!user) {
    console.error('No authenticated user found on server side');
  }

  // Verify user has admin role
  let isAdmin = false;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    } else {
      isAdmin = profile?.is_admin || user.user_metadata?.is_admin;
    }
  }

  if (!isAdmin) {
    console.error('Access denied - user is not an admin');
    // Redirect to tenant dashboard instead of showing admin interface
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You must be an admin to access this page.
            </p>
            <a href="/auth/login" className="text-primary hover:underline">Login</a>
          </div>
        </div>
      </div>
    );
  }

  // Use admin client to bypass RLS and get all data
  const adminClient = createAdminClient();

  // Fetch properties and related data for comprehensive management
  // Use the new API endpoint for properties instead of direct Supabase query
  let propertiesResult = { data: [], count: 0 };
  let blocksResult = { data: [], count: 0 };
  let unitsResult = { data: [], count: 0 };

  try {
    // Fetch properties via API route which uses service role key (include inactive for admin)
    const propertiesRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties?include_inactive=true`, {
      headers: {
        'Authorization': `Bearer ${await getAccessToken(supabase)}`
      },
      cache: 'no-store'
    });

    if (propertiesRes.ok) {
      const propertiesData = await propertiesRes.json();
      propertiesResult = { data: propertiesData.properties || [], count: propertiesData.properties?.length || 0 };
    } else {
      console.error('Failed to fetch properties via API:', propertiesRes.status);
    }

    // For other data, use admin client for direct queries
    const [blocksRes, unitsRes] = await Promise.all([
      safeSupabaseQuery(
        adminClient
          .from("property_blocks")
          .select("*", { count: "exact" })
      ),
      safeSupabaseQuery(
        adminClient
          .from("property_units")
          .select("*", { count: "exact" })
      )
    ]);

    // Check for specific error conditions that are handled gracefully
    const hasBlocksTableError = blocksRes.error?.message?.includes('Could not find the table') || 
                                blocksRes.error?.message?.includes('property_blocks') ||
                                blocksRes.error?.message?.includes('Access denied');
    const hasUnitsTableError = unitsRes.error?.message?.includes('Could not find the table') || 
                               unitsRes.error?.message?.includes('property_units') ||
                               unitsRes.error?.message?.includes('Access denied');

    blocksResult = hasBlocksTableError ? { data: [], count: 0 } : blocksRes;
    unitsResult = hasUnitsTableError ? { data: [], count: 0 } : unitsRes;
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  // Fetch additional stats using admin client (same as /admin page)
  const [
    occupanciesResult,
    usersResult,
    revenueResult,
    landlordPropertiesResult
  ] = await Promise.all([
    // Active occupancies
    adminClient
      .from("property_occupancy_history")
      .select("id", { count: "exact" })
      .eq("status", "active"),
    
    // Total users (tenants)
    adminClient
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("is_admin", false),
    
    // Revenue data for last 6 months
    adminClient
      .from("payment_transactions")
      .select("amount_ugx, created_at, status")
      .eq("status", "completed")
      .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    
    // Landlord profiles count
    adminClient
      .from("landlord_profiles")
      .select("id", { count: "exact" })
  ]);

  // Calculate stats from fetched properties
  const totalProperties = propertiesResult.count || 0;
  const availableProperties = propertiesResult.data?.filter((p: any) => !p.is_occupied).length || 0;
  const occupiedProperties = propertiesResult.data?.filter((p: any) => p.is_occupied).length || 0;
  const totalUsers = usersResult.count || 0;
  const activeOccupancies = occupanciesResult.count || 0;
  const totalLandlords = landlordPropertiesResult.count || 0;

  // Calculate total revenue (same logic as /admin page)
  const revenueByMonth: Record<string, number> = {};
  if (revenueResult.data) {
    for (const transaction of revenueResult.data) {
      if (transaction.amount_ugx && transaction.status === 'completed') {
        const month = new Date(transaction.created_at).toLocaleString('en', { month: 'short' });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + transaction.amount_ugx;
      }
    }
  }
  const totalRevenue = Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Property Management</h1>
            <p className="text-muted-foreground mt-1">Manage your rental properties, blocks, and units</p>
            {user && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                ✅ Logged in as: {user.email} (Admin)
              </div>
            )}
          </div>

          <AdminStats 
            totalProperties={totalProperties}
            availableProperties={availableProperties}
            occupiedProperties={occupiedProperties}
            totalUsers={totalUsers}
            activeOccupancies={activeOccupancies}
            totalRevenue={totalRevenue}
            totalLandlords={totalLandlords}
          />

          <div className="mt-8">
            <ComprehensivePropertyManager 
              initialProperties={propertiesResult.data || []} 
              initialBlocks={blocksResult.data || []}
              initialUnits={unitsResult.data || []}
              userId={user?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}