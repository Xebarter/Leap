import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookingList } from "@/components/tenantView/booking-list"
import { MyPropertiesOverview } from "@/components/tenantView/my-properties-overview"
import { UpcomingPayments } from "@/components/tenantView/upcoming-payments"
import { SavedProperties } from "@/components/tenantView/saved-properties"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileText, Wrench, Bell, AlertTriangle, TrendingUp, CheckCircle, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function TenantDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all relevant data in parallel
  const [
    { data: bookings, error: bookingsError },
    { data: occupancies, error: occupanciesError },
    { data: tenantProfile },
    { data: userProfile },
    { data: pendingPayments },
    { data: openComplaints },
    { data: unreadNotices },
    { data: openMaintenance },
    { data: tenantDashboard },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id,
        booking_type,
        status,
        tenant_id,
        property_id,
        check_in,
        check_out,
        total_price_ugx,
        visit_date,
        visit_time,
        visitor_name,
        visitor_email,
        visitor_phone,
        visit_notes,
        created_at,
        properties(title, location, image_url, price_ugx, property_type)
      `)
      .or(`tenant_id.eq.${user.id},visitor_email.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("property_occupancy_history")
      .select(`
        id,
        property_id,
        status,
        start_date,
        end_date,
        months_paid,
        amount_paid_ugx,
        properties(id, title, location, image_url, price_ugx, property_type)
      `)
      .eq("tenant_id", user.id)
      .in("status", ["active", "extended"])
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("tenant_payment_dues")
      .select("*")
      .eq("tenant_id", user.id)
      .in("status", ["due", "overdue"])
      .limit(3),
    supabase
      .from("tenant_complaints")
      .select("*")
      .eq("tenant_id", user.id)
      .in("status", ["open", "pending_review"])
      .limit(3),
    supabase
      .from("tenant_notices")
      .select("*")
      .eq("tenant_id", user.id)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("maintenance_requests")
      .select("*")
      .eq("tenant_id", user.id)
      .in("status", ["open", "assigned", "in_progress"])
      .limit(3),
    supabase.from("tenant_dashboard_summary").select("*").eq("user_id", user.id).single(),
  ])

  // Debug logging
  console.log('=== TENANT DASHBOARD DEBUG ===')
  console.log('User ID:', user.id)
  console.log('User Email:', user.email)
  console.log('Bookings Error:', bookingsError)
  console.log('Bookings Count:', bookings?.length)
  console.log('Bookings Data:', JSON.stringify(bookings, null, 2))

  // Get the user's display name from multiple possible sources
  const profileName = 
    userProfile?.full_name || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    user?.email?.split('@')[0] || 
    "Guest"

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
          <header className="mb-6 md:mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-12 h-12 md:w-16 md:h-16">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome back, {profileName}!</h1>
                <p className="text-muted-foreground mt-2 text-base md:text-lg">Manage your rentals, payments, and communications</p>
                {tenantProfile?.tenant_number && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <Badge variant="outline" className="text-sm font-mono font-semibold text-primary border-primary/30">
                      Tenant ID: {tenantProfile.tenant_number}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardContent className="pt-4 md:pt-6 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">My Properties</p>
                  <p className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{occupancies?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="pt-4 md:pt-6 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Active Bookings</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{bookings?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="pt-4 md:pt-6 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Pending Payments</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingPayments?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="pt-4 md:pt-6 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Wrench className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Open Maintenance</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{openMaintenance?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="pt-4 md:pt-6 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Unread Notices</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{unreadNotices?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {/* Left Column - Properties, Bookings and Payments */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* My Properties */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">My Properties</h2>
                <MyPropertiesOverview occupancies={occupancies || []} />
              </div>

              {/* Active Bookings */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">My Bookings</h2>
                <BookingList initialBookings={bookings || []} />
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Activity Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {/* Open Complaints */}
                  <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                          <span className="hidden sm:inline">Complaints</span>
                          <span className="sm:hidden">Issues</span>
                        </CardTitle>
                        {openComplaints && openComplaints.length > 0 && (
                          <Badge variant="destructive" className="text-xs">{openComplaints.length}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {openComplaints && openComplaints.length > 0 ? (
                        <div className="space-y-2">
                          {openComplaints.slice(0, 2).map((complaint) => (
                            <div key={complaint.id} className="text-sm p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                              <p className="font-medium truncate">{complaint.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{complaint.complaint_type}</p>
                            </div>
                          ))}
                          <Button asChild variant="outline" size="sm" className="w-full mt-3">
                            <Link href="/tenant/complaints">
                              View All
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">No open complaints</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Maintenance Requests */}
                  <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <Wrench className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                          <span className="hidden sm:inline">Maintenance</span>
                          <span className="sm:hidden">Repairs</span>
                        </CardTitle>
                        {openMaintenance && openMaintenance.length > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">{openMaintenance.length}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {openMaintenance && openMaintenance.length > 0 ? (
                        <div className="space-y-2">
                          {openMaintenance.slice(0, 2).map((request) => (
                            <div key={request.id} className="text-sm p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                              <p className="font-medium truncate">{request.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{request.severity} Priority</p>
                            </div>
                          ))}
                          <Button asChild variant="outline" size="sm" className="w-full mt-3">
                            <Link href="/tenant/maintenance">
                              View All
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">No open requests</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6 md:space-y-8">
              {/* Upcoming Payments */}
              <UpcomingPayments bookings={bookings || []} />

              {/* Recent Notices */}
              <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Bell className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      Notices
                    </CardTitle>
                    {unreadNotices && unreadNotices.length > 0 && (
                      <Badge className="bg-green-100 text-green-800 text-xs">{unreadNotices.length}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unreadNotices && unreadNotices.length > 0 ? (
                    <>
                      {unreadNotices.slice(0, 2).map((notice) => (
                        <div key={notice.id} className="text-sm p-3 bg-muted/30 rounded-lg border-l-3 border-green-600 hover:bg-muted/50 transition-colors">
                          <p className="font-medium truncate">{notice.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notice.notice_type}</p>
                        </div>
                      ))}
                      <Button asChild variant="outline" size="sm" className="w-full mt-2">
                        <Link href="/tenant/notices">
                          View All Notices
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No new notices</p>
                  )}
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Verification</p>
                    <Badge
                      variant={tenantProfile?.verification_status === "verified" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tenantProfile?.verification_status || "Unverified"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Account</p>
                    <Badge 
                      variant={tenantProfile?.status === "active" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {tenantProfile?.status || "Inactive"}
                    </Badge>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link href="/tenant/profile">
                      <FileText className="w-4 h-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
        </div>
      </div>
    </div>
  )
}
