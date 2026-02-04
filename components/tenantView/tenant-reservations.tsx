"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import { MobileMoneyPaymentDialog } from "@/components/publicView/mobile-money-payment-dialog"
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
  X,
  Trash2
} from "lucide-react"

interface TenantReservationsViewProps {
  reservations: any[]
}

export function TenantReservationsView({ reservations: initialReservations }: TenantReservationsViewProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [activeTab, setActiveTab] = useState("all")
  const [isCancelling, setIsCancelling] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

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

  // Open payment dialog
  const openPaymentDialog = (reservation: any) => {
    setSelectedReservation(reservation)
    setPaymentDialogOpen(true)
  }

  // Handle payment success
  const handlePaymentSuccess = (transactionId: string) => {
    // Update the reservation in the local state
    setReservations(prev => prev.map(r => 
      r.id === selectedReservation?.id 
        ? { ...r, payment_status: 'paid', status: 'confirmed' }
        : r
    ))
    
    setPaymentDialogOpen(false)
    setDetailsOpen(false)
    
    toast({
      title: "Payment Successful!",
      description: "Your reservation has been confirmed.",
      variant: "default",
    })
    
    // Refresh the page to get updated data
    router.refresh()
  }

  // Handle cancel reservation
  const handleCancelReservation = async () => {
    if (!selectedReservation) return
    
    setIsCancelling(true)
    const reservationId = selectedReservation.id
    
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel reservation")
      }

      // Set the removing ID to trigger fade-out animation
      setRemovingId(reservationId)
      
      // Close dialog immediately
      setCancelDialogOpen(false)
      setSelectedReservation(null)

      // Wait for animation to complete, then remove from state
      setTimeout(() => {
        setReservations(prev => prev.filter(r => r.id !== reservationId))
        setRemovingId(null)
        
        toast({
          title: "Reservation Cancelled",
          description: "Your reservation has been successfully cancelled.",
          variant: "default",
        })
      }, 300) // Match animation duration

    } catch (error) {
      console.error("Error cancelling reservation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel reservation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
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
    const canCancel = (reservation.status === 'pending' || reservation.status === 'confirmed') && 
                      (reservation.payment_status === 'pending' || reservation.payment_status === 'failed')
    
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
      <Card className={`group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 hover:-translate-y-2 bg-gradient-to-br ${getStatusColor(reservation.status)}`}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none group-hover:from-white/70 transition-all duration-500" />
        
        {/* Delete button - top right corner */}
        {canCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive hover:text-white text-destructive border border-destructive/20 hover:border-destructive opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110"
            onClick={() => openCancelDialog(reservation)}
            title="Delete Reservation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        <CardContent className="p-0 relative">
          {/* Property Image */}
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            {(() => {
              // Get the image URL - prioritize property_images, then fallback to image_url
              const propertyImages = reservation.properties?.property_images
              const primaryImage = propertyImages?.find((img: any) => img.is_primary)?.image_url
              const firstImage = propertyImages?.[0]?.image_url
              const fallbackImage = reservation.properties?.image_url
              const imageUrl = primaryImage || firstImage || fallbackImage

              return imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={reservation.properties?.title || "Property"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center">
                  <Home className="h-16 w-16 text-white opacity-50" />
                </div>
              )
            })()}
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Reservation number badge on image */}
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="secondary" className="font-mono text-xs bg-background/90 backdrop-blur-sm border border-white/20">
                {reservation.reservation_number}
              </Badge>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-bold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors">{reservation.properties?.title}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{reservation.properties?.location}</span>
              </div>
            </div>

          <Separator className="my-4 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 border border-green-500/20 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Amount</span>
              </p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">UGX</span>
                <span className="text-base font-bold text-green-600 dark:text-green-400 break-all">{(reservation.reservation_amount / 100).toLocaleString()}</span>
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 border border-blue-500/20 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Reserved</span>
              </p>
              <div className="text-sm font-semibold break-words">
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
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm animate-pulse cursor-pointer hover:border-amber-500/50 hover:shadow-lg transition-all duration-300 group"
              onClick={() => openPaymentDialog(reservation)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:blur-xl transition-all duration-300" />
              <div className="flex items-start gap-3 relative">
                <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                    Payment Required
                    <span className="text-xs font-normal opacity-75">Click to pay</span>
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Complete your payment to confirm this reservation
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {reservation.payment_status === 'pending' ? (
              <Button 
                variant="default" 
                className="w-full gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 animate-pulse hover:animate-none"
                onClick={() => openPaymentDialog(reservation)}
              >
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Button>
            ) : (
              <Button 
                variant="default" 
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                onClick={() => viewDetails(reservation)}
              >
                <Eye className="h-4 w-4" />
                View Full Details
              </Button>
            )}
            
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
              {reservation.payment_status === 'pending' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
                  onClick={() => viewDetails(reservation)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Details
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
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <Card className="relative overflow-hidden border-none shadow-2xl bg-background">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <CardContent className="relative p-12 flex flex-col items-center text-center">
              {/* Enhanced icon container */}
              <div className="relative mb-10">
                {/* Animated subtle pulse glow */}
                <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
                
                {/* Icon container with enhanced styling */}
                <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl" />
                  
                  {/* Decorative corner accents */}
                  <div className="absolute top-2 right-2 w-3 h-3 bg-white/30 rounded-full" />
                  <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/20 rounded-full" />
                  
                  {/* Icon */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
                    <FileText className="h-20 w-20 text-white relative z-10 drop-shadow-lg" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Enhanced heading with better styling */}
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-bold mb-3 text-foreground tracking-tight">
                  No Reservations Yet
                </h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
                </div>
              </div>
              
              {/* Enhanced subheading */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed px-4">
                Start your journey by browsing our curated collection of properties and reserve your dream home today!
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 w-full">
                <div className="flex flex-col items-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:scale-105 transition-transform duration-300">
                  <div className="bg-blue-500 rounded-full p-3 mb-3">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Browse Properties</h3>
                  <p className="text-xs text-muted-foreground text-center">View hundreds of listings</p>
                </div>
                
                <div className="flex flex-col items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:scale-105 transition-transform duration-300">
                  <div className="bg-purple-500 rounded-full p-3 mb-3">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Secure Booking</h3>
                  <p className="text-xs text-muted-foreground text-center">Reserve with confidence</p>
                </div>
                
                <div className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:scale-105 transition-transform duration-300">
                  <div className="bg-green-500 rounded-full p-3 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Easy Process</h3>
                  <p className="text-xs text-muted-foreground text-center">Quick & hassle-free</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                size="lg" 
                asChild 
                className="gap-3 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/50 transition-all duration-300 h-14 px-10 text-lg font-semibold animate-pulse hover:animate-none group"
              >
                <a href="/properties">
                  <Home className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  Explore Properties
                  <span className="ml-2">→</span>
                </a>
              </Button>

              {/* Helper text */}
              <p className="text-xs text-muted-foreground mt-6">
                💡 Tip: Reserve early to secure the best properties!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="relative overflow-hidden border-2 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-blue-500/5 to-transparent group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Total Reservations</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">{stats.totalReservations}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/50 group-hover:rotate-6 transition-all duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-green-500/5 to-transparent group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Active</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">{stats.activeCount}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-xl group-hover:shadow-green-500/50 group-hover:rotate-6 transition-all duration-300">
                  <Activity className="h-7 w-7 text-white animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-amber-500/5 to-transparent group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Pending Payment</p>
                  <h3 className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">{stats.pendingPayment}</h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-xl group-hover:shadow-amber-500/50 group-hover:rotate-6 transition-all duration-300">
                  <Clock className="h-7 w-7 text-white animate-spin" style={{animationDuration: '3s'}} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-purple-500/5 to-transparent group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:blur-2xl transition-all duration-300" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Total Spent</p>
                  <h3 className="text-xl font-bold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                    UGX {(stats.totalSpent / 100).toLocaleString()}
                  </h3>
                </div>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/50 group-hover:rotate-6 transition-all duration-300">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="relative overflow-hidden border-2 border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 backdrop-blur-sm p-1">
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
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 animate-in fade-in duration-500">
                {filteredReservations.map((reservation, index) => (
                  <div 
                    key={reservation.id}
                    className={`transition-all duration-300 ${
                      removingId === reservation.id 
                        ? 'opacity-0 scale-95 -translate-y-4' 
                        : 'animate-in slide-in-from-bottom-4 opacity-100 scale-100'
                    }`}
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
                    <div className="text-sm flex-1">
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Complete Your Payment</p>
                      <p className="text-amber-700 dark:text-amber-300 text-xs mb-3">
                        Please complete payment to confirm your reservation.
                      </p>
                      <Button 
                        onClick={() => {
                          setDetailsOpen(false)
                          openPaymentDialog(selectedReservation)
                        }}
                        className="w-full gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </Button>
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
              disabled={isCancelling}
              className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all duration-200"
            >
              Keep Reservation
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation}
              disabled={isCancelling}
              className="gap-2 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-lg shadow-destructive/30"
            >
              <Ban className={`h-4 w-4 ${isCancelling ? 'animate-spin' : ''}`} />
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
