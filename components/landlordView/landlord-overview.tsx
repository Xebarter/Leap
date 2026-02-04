import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateConsistent } from "@/lib/date-utils"
import { formatPrice } from "@/lib/utils"
import { Building2, DollarSign, Users, Home, Wrench, AlertCircle } from "lucide-react"

function statCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  gradientClassName,
}: {
  title: string
  value: string | number
  icon: any
  iconClassName: string
  gradientClassName: string
}) {
  return (
    <Card className={`border-none shadow-sm ${gradientClassName} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-4 md:pt-6 pb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${iconClassName} flex items-center justify-center`}>
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
    case "confirmed":
      return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>
    case "completed":
    case "paid":
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">{status}</Badge>
    case "pending":
    case "open":
    case "in_progress":
    case "partially_paid":
    case "overdue":
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    case "failed":
    case "cancelled":
    case "closed":
      return <Badge className="bg-red-100 text-red-800">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function LandlordOverview({
  stats,
  recentUnits,
  recentTenancies,
  recentPayments,
  recentComplaints,
  recentMaintenance,
}: {
  stats: {
    propertiesCount: number
    unitsCount: number
    occupiedUnitsCount: number
    occupancyRate: string
    revenueMonthUgx: number
    overdueInvoicesCount: number
    openComplaintsCount: number
    openMaintenanceCount: number
  }
  recentUnits: any[]
  recentTenancies: any[]
  recentPayments: any[]
  recentComplaints: any[]
  recentMaintenance: any[]
}) {
  return (
    <div className="space-y-6">
      <header className="mb-6 md:mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent rounded-lg blur-3xl -z-10" />
          <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Landlord Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg">
                Manage your properties, units, tenants, payments, and issue tracking.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="bg-background/50 backdrop-blur-sm">
                <Link href="/landlord/properties">Manage Properties</Link>
              </Button>
              <Button asChild className="shadow-lg shadow-primary/20">
                <Link href="/landlord/payments">View Payments</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCard({
          title: "Properties",
          value: stats.propertiesCount,
          icon: Building2,
          iconClassName: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
          gradientClassName: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
        })}
        {statCard({
          title: "Units",
          value: stats.unitsCount,
          icon: Home,
          iconClassName: "bg-green-500/20 text-green-600 dark:text-green-400",
          gradientClassName: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
        })}
        {statCard({
          title: "Occupancy",
          value: stats.occupancyRate,
          icon: Users,
          iconClassName: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
          gradientClassName: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
        })}
        {statCard({
          title: "Revenue (30d)",
          value: formatPrice(stats.revenueMonthUgx),
          icon: DollarSign,
          iconClassName: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
          gradientClassName: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Open Complaints
            </CardTitle>
            <CardDescription>Issues raised by tenants</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats.openComplaintsCount}</div>
            <Button asChild variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm">
              <Link href="/landlord/maintenance">Review</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Wrench className="h-5 w-5 text-purple-600" />
              Open Maintenance
            </CardTitle>
            <CardDescription>Maintenance requests across your properties</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats.openMaintenanceCount}</div>
            <Button asChild variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm">
              <Link href="/landlord/maintenance">Track</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-muted/80 to-muted/50 backdrop-blur-sm p-1.5 rounded-xl overflow-x-auto w-full flex justify-start shadow-sm border border-border/50">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Tenancies</CardTitle>
              <CardDescription>Latest bookings on your properties</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenancies.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.profiles?.full_name || b.profiles?.email || "Tenant"}</TableCell>
                      <TableCell>{statusBadge(b.status)}</TableCell>
                      <TableCell>{b.check_in ? formatDateConsistent(b.check_in) : "-"}</TableCell>
                      <TableCell>{b.check_out ? formatDateConsistent(b.check_out) : "-"}</TableCell>
                      <TableCell className="text-right">{formatPrice(b.total_price_ugx)}</TableCell>
                    </TableRow>
                  ))}
                  {recentTenancies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">No bookings yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Units</CardTitle>
              <CardDescription>Units across your properties</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUnits.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unit_number}</TableCell>
                      <TableCell>{u.unit_type || "-"}</TableCell>
                      <TableCell>
                        {u.is_available ? (
                          <Badge className="bg-green-100 text-green-800">available</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">occupied</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{u.price_ugx ? formatPrice(u.price_ugx) : "-"}</TableCell>
                    </TableRow>
                  ))}
                  {recentUnits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">No units found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.payment_date ? formatDateConsistent(p.payment_date) : "-"}</TableCell>
                      <TableCell className="font-medium">{p.profiles?.full_name || p.profiles?.email || "Tenant"}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">{formatPrice(p.amount_paid_ugx)}</TableCell>
                    </TableRow>
                  ))}
                  {recentPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">No payments yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
              <CardDescription>Latest tenant complaints on your properties</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentComplaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.profiles?.full_name || c.profiles?.email || "Tenant"}</TableCell>
                      <TableCell>{c.complaint_type}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>{formatDateConsistent(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {recentComplaints.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">No complaints yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle>Recent Maintenance</CardTitle>
              <CardDescription>Latest maintenance requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.severity}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell>{m.request_date ? formatDateConsistent(m.request_date) : formatDateConsistent(m.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {recentMaintenance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">No maintenance requests yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
