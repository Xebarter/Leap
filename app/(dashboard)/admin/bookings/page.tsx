import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/adminView/admin-sidebar";
import { ComprehensiveBookingManager } from "@/components/adminView/comprehensive-booking-manager";
import { AdminStats } from "@/components/adminView/admin-stats";

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

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  // Fetch bookings and stats for the admin safely, including unit information
  const [
    bookingsResult, 
    propertiesResult, 
    usersResult
  ] = await Promise.all([
    safeSupabaseQuery(
      supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
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

  // Safely check for errors
  const hasBookingsTableError = Boolean(bookingsResult.error?.message?.includes('Could not find the table')) || 
                                Boolean(bookingsResult.error?.message?.includes('bookings')) ||
                                Boolean(bookingsResult.error?.message?.includes('Access denied'));
  const hasPropertiesTableError = Boolean(propertiesResult.error?.message?.includes('Could not find the table')) || 
                                  Boolean(propertiesResult.error?.message?.includes('properties')) ||
                                  Boolean(propertiesResult.error?.message?.includes('Access denied'));
  const hasProfilesTableError = Boolean(usersResult.error?.message?.includes('Could not find the table')) || 
                                Boolean(usersResult.error?.message?.includes('profiles')) ||
                                Boolean(usersResult.error?.message?.includes('Access denied'));

  // Only log unexpected errors
  if (bookingsResult.error && !hasBookingsTableError) {
    try {
      console.warn("Bookings error:", bookingsResult.error);
    } catch (e) {
      // Silently ignore logging errors
    }
  }

  const finalBookingsResult = hasBookingsTableError 
    ? { data: [], count: 0 } 
    : bookingsResult;
  
  const finalPropertiesResult = hasPropertiesTableError 
    ? { count: 0 } 
    : propertiesResult;
    
  const finalUsersResult = hasProfilesTableError 
    ? { count: 0 } 
    : usersResult;

  // Calculate booking stats
  const confirmedBookings = finalBookingsResult.data?.filter((b: any) => b.status === 'confirmed').length || 0;
  const pendingBookings = finalBookingsResult.data?.filter((b: any) => b.status === 'pending').length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
            <p className="text-muted-foreground mt-1">Manage property bookings and site visits</p>
          </div>

          <AdminStats 
            totalProperties={finalPropertiesResult.count || 0} 
            totalBookings={finalBookingsResult.count || 0} 
            totalUsers={finalUsersResult.count || 0}
            confirmedBookings={confirmedBookings}
            pendingBookings={pendingBookings}
          />

          <div className="mt-8">
            {finalBookingsResult.data && finalBookingsResult.data.length > 0 ? (
              <ComprehensiveBookingManager initialBookings={finalBookingsResult.data} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bookings found. The tables may not be created yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}