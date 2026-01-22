"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Shield,
  Eye,
  Mail,
  Phone,
  CreditCard,
  Info,
  Search,
  Filter,
  Download,
  MessageSquare,
  Ban,
  TrendingUp,
  Activity,
  FileText,
  X
} from "lucide-react"

interface TenantReservationsViewProps {
  reservations: any[]
}

export function TenantReservationsView({ reservations }: TenantReservationsViewProps) {
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [activeTab, setActiveTab] = useState("all")

  // Statistics
  const stats = useMemo(() => {
    const totalReservations = reservations.length
    const activeCount = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length
    const pendingPayment = reservations.filter(r => r.payment_status === 'pending').length
    const totalSpent = reservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.reservation_amount, 0)
    
    return { totalReservations, activeCount, pendingPayment, totalSpent }
  }, [reservations])

  // Filter and sort reservations
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.reservation_number?.toLowerCase().includes(query) ||
        r.properties?.title?.toLowerCase().includes(query) ||
        r.properties?.location?.toLowerCase().includes(query)
      )
    }

    // Tab filter
    if (activeTab !== "all") {
      if (activeTab === "active") {
        filtered = filtered.filter(r => r.status === 'confirmed' || r.status === 'pending')
      } else if (activeTab === "completed") {
        filtered = filtered.filter(r => r.status === 'completed')
      } else if (activeTab === "cancelled") {
        filtered = filtered.filter(r => r.status === 'cancelled' || r.status === 'expired')
      }
    }

    // Status filter (additional)
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.reserved_at).getTime() - new Date(a.reserved_at).getTime()
        case "date-asc":
          return new Date(a.reserved_at).getTime() - new Date(b.reserved_at).getTime()
        case "amount-desc":
          return b.reservation_amount - a.reservation_amount
        case "amount-asc":
          return a.reservation_amount - b.reservation_amount
        case "expires-soon":
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [reservations, searchQuery, activeTab, statusFilter, sortBy])

  // Categorize reservations
  const activeReservations = reservations.filter(r => 
    r.status === 'confirmed' || r.status === 'pending'
  )
  const completedReservations = reservations.filter(r => 
    r.status === 'completed'
  )
  const cancelledReservations = reservations.filter(r => 
    r.status === 'cancelled' || r.status === 'expired'
  )

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending Confirmation", color: "text-yellow-500" },
      confirmed: { variant: "default" as const, icon: CheckCircle2, label: "Confirmed", color: "text-green-500" },
      cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelled", color: "text-red-500" },
      expired: { variant: "outline" as const, icon: AlertTriangle, label: "Expired", color: "text-orange-500" },
      completed: { variant: "outline" as const, icon: CheckCircle2, label: "Completed", color: "text-green-500" },
    }
    
    const { variant, icon: Icon, label, color } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge variant={variant} className="gap-1.5">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </Badge>
    )
  }

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, label: "Payment Pending", icon: Clock },
      paid: { variant: "default" as const, label: "Paid", icon: CheckCircle2 },
      failed: { variant: "destructive" as const, label: "Payment Failed", icon: XCircle },
    }
    
    const { variant, label, icon: Icon } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // View reservation details
  const viewDetails = (reservation: any) => {
    setSelectedReservation(reservation)
    setDetailsOpen(true)
  }

  // Open cancel dialog
  const openCancelDialog = (reservation: any) => {
    setSelectedReservation(reservation)
    setCancelDialogOpen(true)
  }

  // Handle cancel reservation
  const handleCancelReservation = async () => {
    if (!selectedReservation) return
    
    try {
      // TODO: Implement API call to cancel reservation
      console.log("Cancelling reservation:", selectedReservation.id)
      setCancelDialogOpen(false)
      setSelectedReservation(null)
      // Show success message
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      // Show error message
    }
  }

  // Download receipt
  const downloadReceipt = (reservation: any) => {
    // TODO: Implement receipt download
    console.log("Downloading receipt for:", reservation.reservation_number)
  }

  // Contact support
  const contactSupport = (reservation: any) => {
    // TODO: Implement support contact (could open email or chat)
    const subject = `Support for Reservation ${reservation.reservation_number}`
    window.location.href = `mailto:support@example.com?subject=${encodeURIComponent(subject)}`
  }

  // Get days until expiry
  const getDaysUntilExpiry = (expiresAt: string) => {
    return differenceInDays(new Date(expiresAt), new Date())
  }

  const ReservationCard = ({ reservation }: { reservation: any }) => {
    const daysLeft = getDaysUntilExpiry(reservation.expires_at)
    const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed'
    
    // Get status color scheme
    const getStatusColor = (status: string) => {
      const colors = {
        pending: 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20',
        confirmed: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
        cancelled: 'from-red-500/10 to-rose-500/10 border-red-500/20',
        expired: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
        completed: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
      }
      return colors[status as keyof typeof colors] || colors.pending
    }
    
    return (
      <Card className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 hover:-translate-y-1 bg-gradient-to-br ${getStatusColor(reservation.status)}`}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                <Home className="h-7 w-7 text-white relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{reservation.properties?.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="line-clamp-1">{reservation.properties?.location}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm">
                  {reservation.reservation_number}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 border border-green-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Amount
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">UGX</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">{(reservation.reservation_amount / 100).toLocaleString()}</span>
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 border border-blue-500/20">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Reserved
              </p>
              <div className="text-sm font-semibold">
                {format(new Date(reservation.reserved_at), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              {getStatusBadge(reservation.status)}
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 backdrop-blur-sm">
              <span className="text-sm font-medium text-muted-foreground">Payment</span>
              {getPaymentBadge(reservation.payment_status)}
            </div>
          </div>

          {reservation.status === 'confirmed' && daysLeft > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-2 border-blue-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="flex items-start gap-3 relative">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Expires on {format(new Date(reservation.expires_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {reservation.payment_status === 'pending' && (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm animate-pulse">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="flex items-start gap-3 relative">
                <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                    Payment Required
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Complete your payment to confirm this reservation
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              variant="default" 
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={() => viewDetails(reservation)}
            >
              <Eye className="h-4 w-4" />
              View Full Details
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              {reservation.payment_status === 'paid' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200"
                  onClick={() => downloadReceipt(reservation)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Receipt
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all duration-200"
                onClick={() => contactSupport(reservation)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Support
              </Button>
              {canCancel && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:border-destructive/30 col-span-2 transition-all duration-200"
                  onClick={() => openCancelDialog(reservation)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancel Reservation
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reservations.length === 0) {
    return (
      <Card className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <CardContent className="flex flex-col items-center justify-center py-20 relative">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative rounded-full bg-gradient-to-br from-primary via-primary/80 to-purple-500 p-8 shadow-2xl shadow-primary/30">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">No reservations yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-10 text-lg">
            When you reserve a property, it will appear here. Browse our available properties and secure your favorite one today!
          </p>
          <Button size="lg" asChild className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 h-12 px-8">
            <a href="/properties">
              <Home className="h-5 w-5" />
              Browse Properties
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-2 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Total Reservations</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">{stats.totalReservations}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Active</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent">{stats.activeCount}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Activity className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Pending Payment</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-400 bg-clip-text text-transparent">{stats.pendingPayment}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Total Spent</p>
                  <h3 className="text-xl font-bold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    UGX {(stats.totalSpent / 100).toLocaleString()}
                  </h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="relative overflow-hidden border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <CardContent className="p-4 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 z-10" />
                <Input
                  placeholder="Search by reservation number, property, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-2 focus:border-primary/50 bg-background/50 backdrop-blur-sm relative z-10 transition-all duration-200"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px] h-11 border-2 hover:border-primary/30 bg-background/50 backdrop-blur-sm transition-all duration-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Latest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Highest Amount</SelectItem>
                  <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                  <SelectItem value="expires-soon">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 backdrop-blur-sm p-1">
            <TabsTrigger 
              value="all" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">All</span>
              <span className="sm:hidden font-semibold">All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/30 transition-all duration-300"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Active</span>
              <span className="sm:hidden font-semibold">Active</span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 transition-all duration-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Completed</span>
              <span className="sm:hidden font-semibold">Done</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled" 
              className="gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all duration-300"
            >
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Cancelled</span>
              <span className="sm:hidden font-semibold">Cancelled</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredReservations.length === 0 ? (
              <Card className="relative overflow-hidden border-2 border-dashed border-muted-foreground/30 bg-gradient-to-br from-muted/30 to-transparent">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <CardContent className="flex flex-col items-center justify-center py-16 relative">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-muted-foreground/20 rounded-full blur-xl" />
                    <div className="relative rounded-full bg-muted p-6 shadow-lg">
                      <Search className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No reservations found</h3>
                  <p className="text-muted-foreground text-center max-w-md text-base">
                    Try adjusting your search or filters to find what you're looking for
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
                {filteredReservations.map((reservation, index) => (
                  <div 
                    key={reservation.id}
                    className="animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <ReservationCard reservation={reservation} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto border-2 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Reservation Details</span>
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete information about your property reservation
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-5 relative">
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-5 border-2 border-primary/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                <div className="flex items-start gap-4 relative">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                    <Home className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">{selectedReservation.properties?.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedReservation.properties?.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-background/50 backdrop-blur-sm p-4 border">
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Reservation Number</Label>
                  <Badge variant="outline" className="font-mono text-sm bg-primary/5 border-primary/20">
                    {selectedReservation.reservation_number}
                  </Badge>
                </div>
                <div className="rounded-lg bg-background/50 backdrop-blur-sm p-4 border">
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Status</Label>
                  <div>{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 border-2 border-green-500/20">
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Reservation Amount
                  </Label>
                  <div className="font-bold text-2xl text-green-600 dark:text-green-400">
                    UGX {(selectedReservation.reservation_amount / 100).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">1 month rent</p>
                </div>
                <div className="rounded-xl bg-background/50 backdrop-blur-sm p-4 border-2">
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Payment Status</Label>
                  <div>{getPaymentBadge(selectedReservation.payment_status)}</div>
                </div>
              </div>

              {selectedReservation.payment_method && (
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <div className="mt-1 text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{selectedReservation.payment_method.replace('_', ' ')}</span>
                  </div>
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
                  <div className="mt-1 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(selectedReservation.move_in_date), "PPP")}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground">Contact Information</Label>
                <div className="mt-2 space-y-2">
                  {selectedReservation.contact_email && (
                    <div className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedReservation.contact_email}
                    </div>
                  )}
                  {selectedReservation.contact_phone && (
                    <div className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedReservation.contact_phone}
                    </div>
                  )}
                </div>
              </div>

              {selectedReservation.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">Your Notes</Label>
                    <div className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded p-3">
                      {selectedReservation.notes}
                    </div>
                  </div>
                </>
              )}

              {selectedReservation.payment_status === 'pending' && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Complete Your Payment</p>
                      <p className="text-amber-700 dark:text-amber-300 text-xs">
                        Please complete payment to confirm your reservation. Check your email for payment instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 relative pt-4 border-t">
            {selectedReservation?.payment_status === 'paid' && (
              <Button 
                variant="outline" 
                onClick={() => downloadReceipt(selectedReservation)} 
                className="gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>
            )}
            <Button 
              variant="default" 
              onClick={() => setDetailsOpen(false)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[500px] border-2 border-destructive/20 bg-gradient-to-br from-background via-background to-destructive/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-2xl text-destructive">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-lg shadow-destructive/30 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Cancel Reservation
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4 relative">
              <div className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 border-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                    <span className="text-sm font-semibold">Reservation Number</span>
                    <Badge variant="outline" className="font-mono text-sm bg-primary/5 border-primary/20">
                      {selectedReservation.reservation_number}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                    <span className="text-sm font-semibold">Property</span>
                    <span className="text-sm font-medium text-muted-foreground">{selectedReservation.properties?.title}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                    <span className="text-sm font-semibold">Amount</span>
                    <span className="text-base font-bold text-destructive">
                      UGX {(selectedReservation.reservation_amount / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm flex-1">
                    <p className="text-amber-900 dark:text-amber-100 font-medium">
                      {selectedReservation.payment_status === 'paid' 
                        ? 'Refunds may take 5-10 business days to process.' 
                        : 'No payment has been made, so there will be no refund.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 relative pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
              className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200"
            >
              Keep Reservation
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation} 
              className="gap-2 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-lg shadow-destructive/30"
            >
              <Ban className="h-4 w-4" />
              Yes, Cancel Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
