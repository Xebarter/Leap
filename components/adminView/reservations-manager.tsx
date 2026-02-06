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
  AlertTriangle,
  LayoutGrid,
  List,
  Edit
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Reservations Directory</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tenant, property, or reservation number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div className="w-full lg:w-40">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
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

          {/* Reservations List/Grid */}
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reservations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                  ? 'Try adjusting your search filters'
                  : 'No property reservations yet'}
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
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  getStatusBadge={getStatusBadge}
                  getPaymentBadge={getPaymentBadge}
                  onView={viewDetails}
                  onConfirm={(id) => updateReservationStatus(id, "confirmed")}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <ReservationListItem
                  key={reservation.id}
                  reservation={reservation}
                  getStatusBadge={getStatusBadge}
                  getPaymentBadge={getPaymentBadge}
                  onView={viewDetails}
                  onConfirm={(id) => updateReservationStatus(id, "confirmed")}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog - Kept from original implementation */}
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
                  <p className="text-xs text-muted-foreground">Reservation Number</p>
                  <Badge variant="outline" className="font-mono mt-1">
                    {selectedReservation.reservation_number}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Tenant</p>
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
                <p className="text-xs text-muted-foreground">Property</p>
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
                  <p className="text-xs text-muted-foreground">Reservation Amount</p>
                  <div className="font-semibold text-lg text-green-600 dark:text-green-400 mt-1">
                    UGX {(selectedReservation.reservation_amount / 100).toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <div className="mt-1">{getPaymentBadge(selectedReservation.payment_status)}</div>
                </div>
              </div>

              {selectedReservation.payment_method && (
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <div className="mt-1 text-sm capitalize">{selectedReservation.payment_method.replace('_', ' ')}</div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reserved On</p>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.reserved_at), "PPP")}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires On</p>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.expires_at), "PPP")}
                  </div>
                </div>
              </div>

              {selectedReservation.move_in_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Intended Move-in Date</p>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedReservation.move_in_date), "PPP")}
                  </div>
                </div>
              )}

              {selectedReservation.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
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

// Reservation Card Component (Grid View)
function ReservationCard({ reservation, getStatusBadge, getPaymentBadge, onView, onConfirm }: {
  reservation: any
  getStatusBadge: (status: string) => JSX.Element
  getPaymentBadge: (status: string) => JSX.Element
  onView: (reservation: any) => void
  onConfirm: (id: string) => void
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 border">
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-3 border-b">
        <div className="flex items-start gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5 line-clamp-1">
              {reservation.profiles?.full_name || "Unknown"}
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono">
              {reservation.reservation_number}
            </Badge>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mt-2">
          {getStatusBadge(reservation.status)}
          {getPaymentBadge(reservation.payment_status)}
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2">
        {/* Property Info */}
        <div className="bg-muted/40 rounded-lg p-2 border border-muted/60 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Home className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{reservation.properties?.title || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{reservation.properties?.location || "N/A"}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Amount</span>
            </div>
            <span className="text-sm font-bold text-primary">
              UGX {(reservation.reservation_amount / 100).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reserved Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>{format(new Date(reservation.reserved_at), "MMM d, yyyy")}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onView(reservation)}
            className="h-7 text-xs px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {reservation.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onConfirm(reservation.id)}
              className="h-7 text-xs px-2"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Confirm
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Reservation List Item Component (List View)
function ReservationListItem({ reservation, getStatusBadge, getPaymentBadge, onView, onConfirm }: {
  reservation: any
  getStatusBadge: (status: string) => JSX.Element
  getPaymentBadge: (status: string) => JSX.Element
  onView: (reservation: any) => void
  onConfirm: (id: string) => void
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Avatar Section */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center">
              <Shield className="h-12 w-12 text-primary/40 group-hover:scale-110 transition-transform" />
            </div>
            {/* Status Badge Overlay */}
            <div className="absolute top-2 right-2">
              {getStatusBadge(reservation.status)}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="mb-2.5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-0.5 text-foreground line-clamp-1">
                    {reservation.profiles?.full_name || "Unknown"}
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono mt-1">
                    {reservation.reservation_number}
                  </Badge>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onView(reservation)}
                    className="h-7 px-2"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {reservation.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onConfirm(reservation.id)}
                      className="h-7 px-2"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {getPaymentBadge(reservation.payment_status)}
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              {/* Left Column: Property Info */}
              <div className="flex-1 space-y-2">
                <div className="bg-muted/40 rounded-lg p-2 border border-muted/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Home className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{reservation.properties?.title || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{reservation.properties?.location || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{format(new Date(reservation.reserved_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount */}
              <div className="lg:w-48 space-y-2 flex-shrink-0">
                <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground font-medium">Amount</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    UGX {(reservation.reservation_amount / 100).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

