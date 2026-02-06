"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format, addMonths, differenceInDays, isPast } from "date-fns"
import { Search, User, Mail, Phone, Calendar, Plus, Pencil, Trash2, MoreHorizontal, Eye, MapPin, Home, CreditCard, CheckCircle, XCircle, Clock, Building, DollarSign, TrendingUp, History, FileText, Download, LayoutGrid, List, Users, Edit, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ComprehensiveTenantManager({ initialTenants, initialApplications = [] }: { initialTenants: any[], initialApplications?: any[] }) {
  const [tenants, setTenants] = useState(initialTenants)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingTenant, setEditingTenant] = useState<any>(null)
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null)
  const [tenantDetails, setTenantDetails] = useState<Record<string, any>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filteredTenants = tenants.filter(
    (t) => {
      const matchesSearch = 
        t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || 
        (roleFilter === "admin" && t.is_admin) ||
        (roleFilter === "tenant" && !t.is_admin)
      
      return matchesSearch && matchesRole
    }
  )

  // Fetch comprehensive tenant details when expanded
  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (expandedTenantId && !tenantDetails[expandedTenantId] && !loadingDetails[expandedTenantId]) {
        setLoadingDetails(prev => ({ ...prev, [expandedTenantId]: true }))
        
        const supabase = createClient()
        
        // Get all bookings for this tenant
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            *,
            properties (title, location),
            property_units (floor_number, unit_number, block_id),
            property_blocks (name)
          `)
          .eq("tenant_id", expandedTenantId)
          .order("created_at", { ascending: false })

        // Get all properties rented by this tenant (current and past)
        const { data: currentBookings, error: currentBookingsError } = await supabase
          .from("bookings")
          .select(`
            *,
            properties (title, location),
            property_units (floor_number, unit_number, block_id),
            property_blocks (name)
          `)
          .eq("tenant_id", expandedTenantId)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })

        // Get tenant's payment history (we'll calculate this from bookings)
        const paymentHistory = bookingsData?.filter((b: any) => b.status === 'confirmed') || []

        // Calculate tenant stats
        let stats = {}
        if (currentBookings && currentBookings.length > 0) {
          // Calculate how long they've been renting their current unit
          const currentBooking = currentBookings[0]
          const daysRented = differenceInDays(new Date(), new Date(currentBooking.created_at))
          const monthsRented = Math.floor(daysRented / 30)

          // Calculate next payment date (assuming monthly payments)
          const nextPaymentDate = addMonths(new Date(currentBooking.check_in), monthsRented + 1)

          // Calculate how many months ahead they are
          const monthsAhead = monthsRented

          stats = {
            currentBooking,
            daysRented,
            monthsRented,
            nextPaymentDate,
            monthsAhead,
            totalSpent: paymentHistory.reduce((sum: number, booking: any) => sum + (booking.total_price_ugx || 0), 0),
            bookingHistory: bookingsData,
            currentBookings: currentBookings,
            paymentHistory
          }
        }

        if (!bookingsError) {
          setTenantDetails(prev => ({ 
            ...prev, 
            [expandedTenantId]: {
              bookings: bookingsData || [],
              ...stats
            } 
          }))
        }
        
        setLoadingDetails(prev => ({ ...prev, [expandedTenantId]: false }))
      }
    }

    fetchTenantDetails()
  }, [expandedTenantId, tenantDetails, loadingDetails])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-none">
            <CheckCircle className="mr-1 h-3 w-3" /> Confirmed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-none">
            <XCircle className="mr-1 h-3 w-3" /> Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-none">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tenants Directory</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage registered tenants and their information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full lg:w-40">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Roles</option>
                <option value="tenant">Tenants</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tenants List/Grid */}
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'No registered tenants yet'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={() => {
                    setEditingTenant(tenant)
                    setIsOpen(true)
                  }}
                  onView={() => {
                    setExpandedTenantId(tenant.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <TenantListItem
                  key={tenant.id}
                  tenant={tenant}
                  onEdit={() => {
                    setEditingTenant(tenant)
                    setIsOpen(true)
                  }}
                  onView={() => {
                    setExpandedTenantId(tenant.id)
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion for comprehensive tenant details */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Comprehensive Tenant Details</h3>
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          onValueChange={(value) => setExpandedTenantId(value || null)}
        >
          {filteredTenants.map((tenant) => {
            const details = tenantDetails[tenant.id] || {}
            const { 
              currentBooking, 
              daysRented, 
              monthsRented, 
              nextPaymentDate, 
              monthsAhead, 
              totalSpent, 
              bookingHistory,
              currentBookings,
              paymentHistory 
            } = details

            return (
              <AccordionItem key={tenant.id} value={tenant.id} className="border rounded-lg mb-2">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{tenant.full_name || "No name"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{tenant.email}</span>
                        <span>•</span>
                        <span>ID: {tenant.id.substring(0, 8)}...</span>
                        {tenant.is_admin && <Badge className="ml-2">Admin</Badge>}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {loadingDetails[tenant.id] ? (
                    <div className="py-4 text-center text-muted-foreground">Loading tenant details...</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Personal Information Card */}
                      <div className="lg:col-span-1 space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <User className="h-4 w-4" /> Personal Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p><span className="font-medium">Full Name:</span> {tenant.full_name || "N/A"}</p>
                              <p><span className="font-medium">Email:</span> {tenant.email || "N/A"}</p>
                              <p><span className="font-medium">Phone:</span> {tenant.phone || "N/A"}</p>
                              <p><span className="font-medium">Member Since:</span> {tenant.created_at ? format(new Date(tenant.created_at), "MMM d, yyyy") : "N/A"}</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <CreditCard className="h-4 w-4" /> Role & Permissions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p><span className="font-medium">Role:</span> {tenant.is_admin ? "Administrator" : "Standard Tenant"}</p>
                              <p className="text-xs text-muted-foreground">
                                {tenant.is_admin 
                                  ? "Has administrative privileges to manage properties and bookings." 
                                  : "Standard tenant with booking and reservation capabilities."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Current Rental and Stats Card */}
                      <div className="lg:col-span-2 space-y-4">
                        {currentBooking ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Home className="h-4 w-4" /> Current Rental Unit
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Property Details</h4>
                                  <p><span className="font-medium">Property:</span> {currentBooking.properties?.title || "N/A"}</p>
                                  <p><span className="font-medium">Location:</span> {currentBooking.properties?.location || "N/A"}</p>
                                  <p><span className="font-medium">Block:</span> {currentBooking.property_blocks?.name || "N/A"}</p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Unit Details</h4>
                                  <p><span className="font-medium">Floor:</span> {currentBooking.property_units?.floor_number || "N/A"}</p>
                                  <p><span className="font-medium">Unit Number:</span> {currentBooking.property_units?.unit_number || "N/A"}</p>
                                  <p><span className="font-medium">Status:</span> {getStatusBadge(currentBooking.status)}</p>
                                </div>
                                
                                <div className="md:col-span-2 border-t pt-4 mt-2">
                                  <h4 className="font-medium mb-2">Rental Statistics</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-muted/30 p-3 rounded-lg">
                                      <p className="text-sm text-muted-foreground">Rented For</p>
                                      <p className="text-lg font-bold">{monthsRented} <span className="text-sm font-normal">months</span></p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-lg">
                                      <p className="text-sm text-muted-foreground">Months Ahead</p>
                                      <p className="text-lg font-bold">{monthsAhead}</p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-lg">
                                      <p className="text-sm text-muted-foreground">Next Payment</p>
                                      <p className="text-lg font-bold">{nextPaymentDate ? format(new Date(nextPaymentDate), "MMM d, yyyy") : "N/A"}</p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-lg">
                                      <p className="text-sm text-muted-foreground">Total Spent</p>
                                      <p className="text-lg font-bold">UGX {totalSpent ? new Intl.NumberFormat('en-US').format(totalSpent) : 0}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Home className="h-4 w-4" /> Current Rental Unit
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground">No active rental unit found.</p>
                            </CardContent>
                          </Card>
                        )}

                        {/* Other Units Currently Rented */}
                        {currentBookings && currentBookings.length > 1 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Building className="h-4 w-4" /> Other Units Currently Rented
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Property</TableHead>
                                      <TableHead>Block</TableHead>
                                      <TableHead>Floor</TableHead>
                                      <TableHead>Unit</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {currentBookings
                                      .filter((booking: any) => booking.id !== currentBooking?.id)
                                      .map((booking: any) => (
                                        <TableRow key={booking.id}>
                                          <TableCell className="font-medium">
                                            {booking.properties?.title || "N/A"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.property_blocks?.name || "N/A"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.property_units?.floor_number || "N/A"}
                                          </TableCell>
                                          <TableCell>
                                            {booking.property_units?.unit_number || "N/A"}
                                          </TableCell>
                                          <TableCell>
                                            {getStatusBadge(booking.status)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Payment History */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <DollarSign className="h-4 w-4" /> Payment History
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {paymentHistory && paymentHistory.length > 0 ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Property</TableHead>
                                      <TableHead>Period</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paymentHistory.map((payment: any) => (
                                      <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                          {payment.properties?.title || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(payment.check_in)} - {formatDate(payment.check_out)}
                                        </TableCell>
                                        <TableCell>
                                          UGX {payment.total_price_ugx ? new Intl.NumberFormat('en-US').format(payment.total_price_ugx) : "0"}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(payment.created_at)}
                                        </TableCell>
                                        <TableCell>
                                          {getStatusBadge(payment.status)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No payment history available.</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Renting History */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <History className="h-4 w-4" /> Renting History
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {bookingHistory && bookingHistory.length > 0 ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Property</TableHead>
                                      <TableHead>Block</TableHead>
                                      <TableHead>Unit</TableHead>
                                      <TableHead>Dates</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {bookingHistory.map((booking: any) => (
                                      <TableRow key={booking.id}>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                            {booking.properties?.title || "N/A"}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {booking.property_blocks?.name || "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          {booking.property_units ? (
                                            <div className="flex items-center gap-1">
                                              <Home className="h-4 w-4" />
                                              <div>
                                                <div>Floor {booking.property_units.floor_number}</div>
                                                <div className="text-xs text-muted-foreground">Unit {booking.property_units.unit_number}</div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-muted-foreground">-</div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="text-sm">
                                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {booking.total_price_ugx 
                                            ? `UGX ${new Intl.NumberFormat('en-US').format(booking.total_price_ugx)}` 
                                            : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          {getStatusBadge(booking.status)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No renting history available.</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* Tenant Details Dialog */}
      {expandedTenantId && (
        <Dialog open={!!expandedTenantId} onOpenChange={() => setExpandedTenantId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tenant Details</DialogTitle>
            </DialogHeader>
            {loadingDetails[expandedTenantId] ? (
              <div className="py-4 text-center text-muted-foreground">Loading tenant details...</div>
            ) : (
              <TenantDetailsView 
                tenant={tenants.find(t => t.id === expandedTenantId)!}
                details={tenantDetails[expandedTenantId]}
                getStatusBadge={getStatusBadge}
                formatDate={formatDate}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Tenant Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(val) => {
          setIsOpen(val)
          if (!val) setEditingTenant(null)
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" defaultValue={editingTenant?.full_name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={editingTenant?.email} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={editingTenant?.phone || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_admin">Admin Status</Label>
              <select
                id="is_admin"
                name="is_admin"
                defaultValue={editingTenant?.is_admin ? "true" : "false"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">Tenant</option>
                <option value="true">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Update Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Tenant Card Component (Grid View)
function TenantCard({ tenant, onEdit, onView }: {
  tenant: any
  onEdit: () => void
  onView: () => void
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 border">
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 border-b">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-0.5 line-clamp-1">
              {tenant.full_name || "No name"}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{tenant.email}</span>
            </div>
            {tenant.phone && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{tenant.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Badge */}
        <div className="mt-3">
          {tenant.is_admin ? (
            <Badge className="bg-red-500/10 text-red-500 border-none">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          ) : (
            <Badge className="bg-blue-500/10 text-blue-500 border-none">
              <User className="h-3 w-3 mr-1" />
              Tenant
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2.5">
        {/* Member Since */}
        <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="text-muted-foreground">Member Since</div>
              <div className="font-medium text-foreground">
                {tenant.created_at ? format(new Date(tenant.created_at), "MMM d, yyyy") : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant ID */}
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Tenant ID</span>
            <span className="text-xs font-mono font-semibold text-primary">{tenant.id.substring(0, 8)}...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button 
            variant="default" 
            size="sm"
            onClick={onView}
            className="h-7 text-xs px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
            className="h-7 text-xs px-2"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Tenant List Item Component (List View)
function TenantListItem({ tenant, onEdit, onView }: {
  tenant: any
  onEdit: () => void
  onView: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Avatar Section */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform" />
            </div>
            {/* Role Badge Overlay */}
            <div className="absolute top-2 right-2">
              {tenant.is_admin ? (
                <Badge className="bg-red-500/10 text-red-500 border-none text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge className="bg-blue-500/10 text-blue-500 border-none text-xs">
                  Tenant
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="mb-2.5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-0.5 text-foreground line-clamp-1">
                    {tenant.full_name || "No name"}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-0.5">
                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{tenant.email}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{tenant.phone}</span>
                    </div>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onView}
                    className="h-7 px-2"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onEdit}
                    className="h-7 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              {/* Left Column: Member Info */}
              <div className="flex-1 space-y-2">
                <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-muted-foreground">Member Since</div>
                      <div className="font-medium text-foreground">
                        {tenant.created_at ? format(new Date(tenant.created_at), "MMM d, yyyy") : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tenant ID */}
              <div className="lg:w-48 space-y-2 flex-shrink-0">
                <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Tenant ID</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-primary">{tenant.id.substring(0, 12)}...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Tenant Details View Component
function TenantDetailsView({ tenant, details, getStatusBadge, formatDate }: {
  tenant: any
  details: any
  getStatusBadge: (status: string) => JSX.Element
  formatDate: (dateString: string) => string
}) {
  const { 
    currentBooking, 
    daysRented, 
    monthsRented, 
    nextPaymentDate, 
    monthsAhead, 
    totalSpent, 
    bookingHistory,
    currentBookings,
    paymentHistory 
  } = details || {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Personal Information Card */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Full Name:</span> {tenant.full_name || "N/A"}</p>
              <p><span className="font-medium">Email:</span> {tenant.email || "N/A"}</p>
              <p><span className="font-medium">Phone:</span> {tenant.phone || "N/A"}</p>
              <p><span className="font-medium">Member Since:</span> {tenant.created_at ? format(new Date(tenant.created_at), "MMM d, yyyy") : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-4 w-4" /> Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Role:</span> {tenant.is_admin ? "Administrator" : "Standard Tenant"}</p>
              <p className="text-xs text-muted-foreground">
                {tenant.is_admin 
                  ? "Has administrative privileges to manage properties and bookings." 
                  : "Standard tenant with booking and reservation capabilities."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Information - Rest of the details */}
      <div className="lg:col-span-2">
        <p className="text-sm text-muted-foreground">Detailed rental and payment history will be displayed here.</p>
      </div>
    </div>
  )
}