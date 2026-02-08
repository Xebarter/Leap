import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { AdminStats } from "@/components/adminView/admin-stats"
import { AdminAnalytics } from "@/components/adminView/admin-analytics"
import { RecentActivity } from "@/components/adminView/recent-activity"
import { redirect } from "next/navigation"

// Helper function to get month name from date
const getMonthName = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

// Helper to get access token
async function getAccessToken(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // Use admin client to bypass RLS and get all data
  const adminClient = createAdminClient()

  // Fetch properties via API route (same as /admin/properties page) to get ALL properties
  let allProperties: any[] = [];
  try {
    const propertiesRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/properties?include_inactive=true`, {
      headers: {
        'Authorization': `Bearer ${await getAccessToken(supabase)}`
      },
      cache: 'no-store'
    });

    if (propertiesRes.ok) {
      const propertiesData = await propertiesRes.json();
      allProperties = propertiesData.properties || [];
    } else {
      console.error('Failed to fetch properties via API:', propertiesRes.status);
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
  }

  // Fetch comprehensive stats and data using admin client
  const [
    occupanciesResult,
    usersResult,
    recentTransactionsResult,
    revenueResult,
    landlordPropertiesResult,
    recentActivitiesResult
  ] = await Promise.all([
    // Active occupancies
    adminClient
      .from("property_occupancy_history")
      .select("*, properties(title, property_code), profiles!property_occupancy_history_tenant_id_fkey(full_name, email)", { count: "exact" })
      .eq("status", "active")
      .order("end_date", { ascending: true })
      .limit(10),
    
    // Total users (tenants)
    adminClient
      .from("profiles")
      .select("id, created_at", { count: "exact" })
      .eq("is_admin", false),
    
    // Recent payment transactions
    adminClient
      .from("payment_transactions")
      .select(`
        id,
        amount_ugx,
        payment_method,
        status,
        created_at,
        profiles!payment_transactions_tenant_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(10),
    
    // Revenue data for last 6 months
    adminClient
      .from("payment_transactions")
      .select("amount_ugx, created_at, status")
      .eq("status", "completed")
      .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    
    // Landlord properties count
    adminClient
      .from("landlord_profiles")
      .select("id", { count: "exact" }),

    // Recent property views and interests
    adminClient
      .from("property_interested")
      .select(`
        id,
        created_at,
        properties(title, property_code),
        profiles(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(10)
  ])

  // Calculate stats from fetched properties
  const totalProperties = allProperties.length
  const availableProperties = allProperties.filter(p => !p.is_occupied).length
  const occupiedProperties = allProperties.filter(p => p.is_occupied).length
  const totalUsers = usersResult.count || 0
  const activeOccupancies = occupanciesResult.count || 0
  const totalLandlords = landlordPropertiesResult.count || 0

  // Calculate revenue by month
  const revenueByMonth: Record<string, number> = {};
  if (revenueResult.data) {
    for (const transaction of revenueResult.data) {
      if (transaction.amount_ugx && transaction.status === 'completed') {
        const month = getMonthName(transaction.created_at);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + transaction.amount_ugx;
      }
    }
  }

  // Create revenue data array for chart (last 6 months)
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[date.getMonth()];
    revenueData.push({
      month: monthName,
      revenue: revenueByMonth[monthName] || 0
    });
  }

  // Calculate total revenue
  const totalRevenue = Object.values(revenueByMonth).reduce((sum, val) => sum + val, 0);

  // Calculate booking trends (simulated from transactions - group by day of week)
  const bookingTrends = [
    { day: "Mon", bookings: 0 },
    { day: "Tue", bookings: 0 },
    { day: "Wed", bookings: 0 },
    { day: "Thu", bookings: 0 },
    { day: "Fri", bookings: 0 },
    { day: "Sat", bookings: 0 },
    { day: "Sun", bookings: 0 },
  ];

  if (recentTransactionsResult.data) {
    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    recentTransactionsResult.data.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at);
      if (transactionDate.getTime() >= lastWeek) {
        const dayIndex = transactionDate.getDay();
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
        const trend = bookingTrends.find(t => t.day === dayName);
        if (trend) trend.bookings++;
      }
    });
  }

  // Calculate top properties by revenue from fetched properties
  const topProperties = allProperties
    .map(property => ({
      name: property.title,
      location: property.location || 'N/A',
      occupancy: property.is_occupied ? '100%' : '0%',
      revenue: property.price_ugx || 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  // Prepare recent activities
  const recentActivities = recentActivitiesResult.data?.map(activity => ({
    id: activity.id,
    type: 'property_interest' as const,
    description: `${activity.profiles?.full_name || 'Someone'} showed interest in ${activity.properties?.title || 'a property'}`,
    timestamp: activity.created_at,
    user: activity.profiles?.full_name || 'Unknown',
    propertyCode: activity.properties?.property_code
  })) || [];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Overview of your rental management system
            </p>
          </div>
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

        <div className="mt-8 md:mt-12 space-y-8">
          <AdminAnalytics 
            revenueData={revenueData}
            bookingTrends={bookingTrends}
            topProperties={topProperties}
          />

          <RecentActivity 
            activities={recentActivities}
            occupancies={occupanciesResult.data || []}
            transactions={recentTransactionsResult.data || []}
          />
        </div>
      </main>
    </div>
  )
}