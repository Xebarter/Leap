"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal, 
  User, 
  Home, 
  Mail, 
  Phone, 
  MapPin, 
  Search,
  DollarSign,
  Calendar,
  Shield,
  Download,
  RefreshCw,
  Filter,
  Eye,
  AlertTriangle
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface ReservationsManagerProps {
  initialReservations: any[]
}

export function ReservationsManager({ initialReservations }: ReservationsManagerProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled" | "expired">("all")
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "paid" | "failed">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reservations.length
    const pending = reservations.filter(r => r.status === 'pending').length
    const confirmed = reservations.filter(r => r.status === 'confirmed').length
    const cancelled = reservations.filter(r => r.status === 'cancelled').length
    const expired = reservations.filter(r => r.status === 'expired').length
    const paidAmount = reservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.reservation_amount || 0), 0)

    return { total, pending, confirmed, cancelled, expired, paidAmount }
  }, [reservations])

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesSearch = 
        reservation.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.properties?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.properties?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reservation.reservation_number?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
      const matchesPayment = paymentFilter === "all" || reservation.payment_status === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [reservations, searchQuery, statusFilter, paymentFilter])

  // Refresh reservations
  const refreshReservations = async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("property_reservations")
      .select(`
        *,
        properties (id, title, location, price_ugx),
        profiles!property_reservations_tenant_id_fkey (id, full_name, email, phone)
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setReservations(data)
    }
    setIsRefreshing(false)
  }

  // Update reservation status
  const updateReservationStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const updates: any = { status }
    
    if (status === 'confirmed') {
      updates.confirmed_by = user?.id
      updates.confirmed_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updates.cancelled_by = user?.id
      updates.cancelled_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("property_reservations")
      .update(updates)
      .eq("id", id)

    if (error) {
      toast.error("Failed to update reservation", { description: error.message })
    } else {
      toast.success(`Reservation ${status}!`)
      refreshReservations()
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      confirmed: { variant: "default" as const, icon: CheckCircle2, label: "Confirmed" },
      cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
      expired: { variant: "outline" as const, icon: AlertTriangle, label: "Expired" },
    }
    
    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, label: "Pending" },
      paid: { variant: "default" as const, label: "Paid" },
      failed: { variant: "destructive" as const, label: "Failed" },
      refunded: { variant: "outline" as const, label: "Refunded" },
    }
    
    const { variant, label } = config[status as keyof typeof config] || config.pending
    
    return <Badge variant={variant}>{label}</Badge>
  }

  // View reservation details
  const viewDetails = (reservation: any) => {
    setSelectedReservation(reservation)
    setDetailsOpen(true)
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.confirmed} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.paidAmount / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              UGX from reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled/Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled + stats.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cancelled} cancelled • {stats.expired} expired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>All Reservations</CardTitle>
              <CardDescription>
                Manage and track property reservations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshReservations}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant name, email, property, or reservation number..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Status:</span>
            </div>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={statusFilter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmed ({stats.confirmed})
            </Button>
            <Button
              variant={statusFilter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled ({stats.cancelled})
            </Button>
            <Button
              variant={statusFilter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("expired")}
            >
              Expired ({stats.expired})
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium">Payment:</span>
            </div>
            <Button
              variant={paymentFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("all")}
            >
              All
            </Button>
            <Button
              variant={paymentFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={paymentFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentFilter("paid")}
            >
              Paid
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filteredReservations.length}</strong> of{" "}
              <strong className="text-foreground">{stats.total}</strong> reservations
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No reservations found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                ? "Try adjusting your filters or search query to see more results."
                : "When tenants reserve properties, they'll appear here."}
            </p>
            {(searchQuery || statusFilter !== "all" || paymentFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setPaymentFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {reservation.profiles?.full_name || "Unknown"}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1 font-mono">
                          {reservation.reservation_number}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(reservation.status)}
                      {getPaymentBadge(reservation.payment_status)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{reservation.properties?.title || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{reservation.properties?.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-semibold">
                        UGX {(reservation.reservation_amount / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(reservation.reserved_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => viewDetails(reservation)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    {reservation.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => updateReservationStatus(reservation.id, "confirmed")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Reservation #</TableHead>
                    <TableHead className="font-semibold">Tenant</TableHead>
                    <TableHead className="font-semibold">Property</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="w-[80px] text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {reservation.reservation_number}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {reservation.profiles?.full_name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {reservation.profiles?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {reservation.properties?.title || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{reservation.properties?.location || "N/A"}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          UGX {(reservation.reservation_amount / 100).toLocaleString()}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(reservation.status)}
                      </TableCell>
                      
                      <TableCell>
                        {getPaymentBadge(reservation.payment_status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(reservation.reserved_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => viewDetails(reservation)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {reservation.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => updateReservationStatus(reservation.id, "confirmed")}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                Confirm Reservation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => updateReservationStatus(reservation.id, "cancelled")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Reservation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Reservation Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this property reservation
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Reservation Number</Label>
                  <Badge variant="outline" className="font-mono mt-1">
                    {selectedReservation.reservation_number}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">Tenant</Label>
                <div className="mt-2 space-y-1">
                  <div className="font-medium">{selectedReservation.profiles?.full_name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedReservation.profiles?.email || selectedReservation.contact_email}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedReservation.contact_phone || selectedReservation.profiles?.phone || "N/A"}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">Property</Label>
                <div className="mt-2 space-y-1">
                  <div className="font-medium">{selectedReservation.properties?.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedReservation.properties?.location}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Reservation Amount</Label>
                  <div className="font-semibold text-lg text-green-600 dark:text-green-400 mt-1">
                    UGX {(selectedReservation.reservation_amount / 100).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Status</Label>
                  <div className="mt-1">{getPaymentBadge(selectedReservation.payment_status)}</div>
                </div>
              </div>

              {selectedReservation.payment_method && (
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <div className="mt-1 text-sm capitalize">{selectedReservation.payment_method.replace('_', ' ')}</div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Reserved On</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.reserved_at), "PPP")}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expires On</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.expires_at), "PPP")}
                  </div>
                </div>
              </div>

              {selectedReservation.move_in_date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Intended Move-in Date</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.move_in_date), "PPP")}
                  </div>
                </div>
              )}

              {selectedReservation.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <div className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded p-3">
                      {selectedReservation.notes}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
