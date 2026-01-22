import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { AdminStats } from "@/components/adminView/admin-stats"
import { AdminAnalytics } from "@/components/adminView/admin-analytics"
import { UpcomingPayments } from "@/components/tenantView/upcoming-payments"

// Helper function to get month name from date
const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch stats and data for the admin
  const [
    propertiesResult, 
    bookingsResult, 
    usersResult, 
    paymentsResult,
    revenueResult
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact" }),
    supabase
      .from("bookings")
      .select("*, properties(title), profiles(full_name, email), property_units(floor_number, unit_number)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("profiles").select("*", { count: "exact" }),
    supabase
      .from("bookings")
      .select("*, properties(title), property_units(floor_number, unit_number)")
      .in("status", ["confirmed"])
      .gte("check_out", new Date().toISOString().split('T')[0])
      .order("check_in", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("total_price_ugx, created_at")
      .gte("created_at", new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
  ])

  // Calculate revenue data grouped by month
  const revenueByMonth: Record<string, number> = {};
  if (revenueResult.data) {
    for (const booking of revenueResult.data) {
      if (booking.total_price_ugx) {
        const month = getMonthName(booking.created_at);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + booking.total_price_ugx;
      }
    }
  }

  // Create revenue data array for chart
  const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue
  }));

  // Calculate additional stats
  const totalUsers = usersResult.count || 0
  const confirmedBookings = bookingsResult.data?.filter(b => b.status === 'confirmed').length || 0
  const pendingBookings = bookingsResult.data?.filter(b => b.status === 'pending').length || 0

  // Default revenue data if no real data is available
  const finalRevenueData = revenueData.length > 0 
    ? revenueData 
    : [
        { month: "Jan", revenue: 4500000 },
        { month: "Feb", revenue: 5200000 },
        { month: "Mar", revenue: 4800000 },
        { month: "Apr", revenue: 6100000 },
        { month: "May", revenue: 5900000 },
        { month: "Jun", revenue: 7200000 },
      ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your rental properties and bookings.</p>
          </div>
        </div>

        <AdminStats 
          totalProperties={propertiesResult.count || 0} 
          totalBookings={bookingsResult.count || 0} 
          totalUsers={totalUsers}
          confirmedBookings={confirmedBookings}
          pendingBookings={pendingBookings}
        />

        <div className="mt-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AdminAnalytics revenueData={finalRevenueData} />
            <UpcomingPayments bookings={paymentsResult.data || []} />
          </div>
        </div>
      </main>
    </div>
  )
}