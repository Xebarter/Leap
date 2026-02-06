"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import {
  Search,
  User,
  Mail,
  Phone,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Building,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  Home,
  CreditCard,
  UserCheck,
  UserX,
  Ban,
  ShieldCheck,
  Star,
  LayoutGrid,
  List,
  Users,
  Building2,
  MapPin,
  Edit
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// TypeScript interfaces
interface LandlordProfile {
  id: string
  user_id: string
  business_name: string | null
  business_registration_number: string | null
  phone_number: string | null
  alternative_phone: string | null
  business_address: string | null
  city: string | null
  district: string | null
  postal_code: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  mobile_money_number: string | null
  mobile_money_provider: string | null
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'blacklisted'
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  verification_date: string | null
  verified_by: string | null
  verification_notes: string | null
  id_document_type: string | null
  id_document_number: string | null
  id_document_url: string | null
  commission_rate: number
  payment_schedule: string
  total_properties: number
  total_units: number
  occupied_units: number
  total_revenue_ugx: number
  total_commission_paid_ugx: number
  preferred_communication: string
  notifications_enabled: boolean
  notes: string | null
  rating: number
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface LandlordFormData {
  user_id: string
  business_name: string
  phone_number: string
  alternative_phone: string
  business_address: string
  city: string
  district: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  mobile_money_number: string
  mobile_money_provider: string
  commission_rate: number
  payment_schedule: string
  status: string
  verification_status: string
  notes: string
}

export function ComprehensiveLandlordManager({ initialLandlords }: { initialLandlords: LandlordProfile[] }) {
  const [landlords, setLandlords] = useState<LandlordProfile[]>(initialLandlords)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingLandlord, setEditingLandlord] = useState<LandlordProfile | null>(null)
  const [expandedLandlordId, setExpandedLandlordId] = useState<string | null>(null)
  const [landlordDetails, setLandlordDetails] = useState<Record<string, any>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [verificationFilter, setVerificationFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter landlords
  const filteredLandlords = useMemo(() => {
    return landlords.filter((landlord) => {
      const matchesSearch = 
        landlord.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        landlord.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        landlord.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        landlord.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || landlord.status === statusFilter
      const matchesVerification = verificationFilter === "all" || landlord.verification_status === verificationFilter

      return matchesSearch && matchesStatus && matchesVerification
    })
  }, [landlords, searchQuery, statusFilter, verificationFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = landlords.length
    const active = landlords.filter(l => l.status === 'active').length
    const verified = landlords.filter(l => l.verification_status === 'verified').length
    const pending = landlords.filter(l => l.verification_status === 'pending').length
    const totalProperties = landlords.reduce((sum, l) => sum + (l.total_properties || 0), 0)
    const totalUnits = landlords.reduce((sum, l) => sum + (l.total_units || 0), 0)

    return { total, active, verified, pending, totalProperties, totalUnits }
  }, [landlords])

  // Fetch detailed landlord information
  const fetchLandlordDetails = async (landlordId: string) => {
    if (landlordDetails[landlordId] || loadingDetails[landlordId]) return

    setLoadingDetails(prev => ({ ...prev, [landlordId]: true }))
    const supabase = createClient()

    try {
      // Fetch properties
      const { data: properties } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", landlordId)

      // Fetch payments
      const { data: payments } = await supabase
        .from("landlord_payments")
        .select("*")
        .eq("landlord_id", landlordId)
        .order("created_at", { ascending: false })

      // Fetch documents
      const { data: documents } = await supabase
        .from("landlord_documents")
        .select("*")
        .eq("landlord_id", landlordId)

      setLandlordDetails(prev => ({
        ...prev,
        [landlordId]: { properties, payments, documents }
      }))
    } catch (error) {
      console.error("Error fetching landlord details:", error)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [landlordId]: false }))
    }
  }

  // Refresh landlords list
  const refreshLandlords = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("landlord_profiles")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setLandlords(data as LandlordProfile[])
    }
    setIsLoading(false)
  }

  // Handle expanding landlord details
  const handleToggleExpand = (landlordId: string) => {
    if (expandedLandlordId === landlordId) {
      setExpandedLandlordId(null)
    } else {
      setExpandedLandlordId(landlordId)
      fetchLandlordDetails(landlordId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Landlords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Landlords Directory</CardTitle>
              <CardDescription>
                Manage property owners, verify accounts, and track commissions
              </CardDescription>
            </div>
            <Button onClick={() => setIsOpen(true)} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Landlord
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, business name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification Filter */}
            <div className="w-full lg:w-40">
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Landlords List/Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLandlords.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No landlords found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || verificationFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Get started by creating your first landlord'}
              </p>
              {!searchQuery && statusFilter === 'all' && verificationFilter === 'all' && (
                <Button onClick={() => setIsOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Landlord
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLandlords.map((landlord) => (
                <LandlordCard
                  key={landlord.id}
                  landlord={landlord}
                  onEdit={() => {
                    setEditingLandlord(landlord)
                    setIsOpen(true)
                  }}
                  onDelete={async () => {
                    if (confirm("Are you sure you want to delete this landlord?")) {
                      const supabase = createClient()
                      const { error } = await supabase
                        .from("landlord_profiles")
                        .delete()
                        .eq("id", landlord.id)
                      
                      if (error) {
                        toast.error("Failed to delete landlord")
                      } else {
                        toast.success("Landlord deleted successfully")
                        refreshLandlords()
                      }
                    }
                  }}
                  onView={() => {
                    setExpandedLandlordId(landlord.id)
                    fetchLandlordDetails(landlord.id)
                  }}
                  onRefresh={refreshLandlords}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLandlords.map((landlord) => (
                <LandlordListItem
                  key={landlord.id}
                  landlord={landlord}
                  onEdit={() => {
                    setEditingLandlord(landlord)
                    setIsOpen(true)
                  }}
                  onDelete={async () => {
                    if (confirm("Are you sure you want to delete this landlord?")) {
                      const supabase = createClient()
                      const { error } = await supabase
                        .from("landlord_profiles")
                        .delete()
                        .eq("id", landlord.id)
                      
                      if (error) {
                        toast.error("Failed to delete landlord")
                      } else {
                        toast.success("Landlord deleted successfully")
                        refreshLandlords()
                      }
                    }
                  }}
                  onView={() => {
                    setExpandedLandlordId(landlord.id)
                    fetchLandlordDetails(landlord.id)
                  }}
                  onRefresh={refreshLandlords}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Landlord Dialog */}
      <LandlordDialog
        landlord={editingLandlord}
        onClose={() => {
          setEditingLandlord(null)
          setIsOpen(false)
        }}
        onSave={refreshLandlords}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      {/* Landlord Details Dialog */}
      {expandedLandlordId && (
        <Dialog open={!!expandedLandlordId} onOpenChange={() => setExpandedLandlordId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Landlord Details</DialogTitle>
            </DialogHeader>
            {loadingDetails[expandedLandlordId] ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <LandlordDetailsView 
                landlord={landlords.find(l => l.id === expandedLandlordId)!} 
                details={landlordDetails[expandedLandlordId]} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}

// Landlord Card Component (Grid View)
function LandlordCard({ landlord, onEdit, onDelete, onView, onRefresh }: {
  landlord: LandlordProfile
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onRefresh: () => void
}) {
  const supabase = createClient()

  const handleUpdateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("landlord_profiles")
      .update({ status: newStatus })
      .eq("id", landlord.id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success("Status updated successfully")
      onRefresh()
    }
  }

  const handleUpdateVerification = async (newStatus: string) => {
    const { error } = await supabase
      .from("landlord_profiles")
      .update({ 
        verification_status: newStatus,
        verification_date: newStatus === 'verified' ? new Date().toISOString() : null
      })
      .eq("id", landlord.id)

    if (error) {
      toast.error("Failed to update verification status")
    } else {
      toast.success("Verification status updated successfully")
      onRefresh()
    }
  }

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
              {landlord.profiles?.full_name || "N/A"}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{landlord.profiles?.email}</span>
            </div>
            {landlord.business_name && (
              <div className="flex items-center text-xs font-medium text-foreground">
                <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{landlord.business_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mt-3">
          <StatusBadge status={landlord.status} />
          <VerificationBadge status={landlord.verification_status} />
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2.5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground leading-tight">Properties</div>
            <div className="text-sm font-bold text-foreground">{landlord.total_properties || 0}</div>
          </div>

          <div className="text-center p-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <Home className="h-4 w-4 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground leading-tight">Units</div>
            <div className="text-sm font-bold text-foreground">{landlord.total_units || 0}</div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-muted/40 rounded-lg p-2 border border-muted/60 space-y-1">
          {landlord.phone_number && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{landlord.phone_number}</span>
            </div>
          )}
          {landlord.mobile_money_number && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{landlord.mobile_money_provider}: {landlord.mobile_money_number}</span>
            </div>
          )}
        </div>

        {/* Commission Info */}
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Commission</span>
            </div>
            <span className="text-sm font-bold text-primary">{landlord.commission_rate}%</span>
          </div>
          {landlord.payment_schedule && (
            <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{landlord.payment_schedule}</div>
          )}
        </div>

        {/* Rating */}
        {landlord.rating && landlord.rating > 0 && (
          <div className="flex items-center justify-center gap-1 py-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-semibold">{landlord.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <Button 
            variant="default" 
            size="sm"
            onClick={onView}
            className="h-7 text-xs px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
            className="h-7 text-xs px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Landlord List Item Component (List View)
function LandlordListItem({ landlord, onEdit, onDelete, onView, onRefresh }: {
  landlord: LandlordProfile
  onEdit: () => void
  onDelete: () => void
  onView: () => void
  onRefresh: () => void
}) {
  const supabase = createClient()

  const handleUpdateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("landlord_profiles")
      .update({ status: newStatus })
      .eq("id", landlord.id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success("Status updated successfully")
      onRefresh()
    }
  }

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Avatar Section */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform" />
            </div>
            {/* Status Badge Overlay */}
            <div className="absolute top-2 right-2">
              <StatusBadge status={landlord.status} />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="mb-2.5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-0.5 text-foreground line-clamp-1">
                    {landlord.profiles?.full_name || "N/A"}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-0.5">
                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{landlord.profiles?.email}</span>
                  </div>
                  {landlord.business_name && (
                    <div className="flex items-center text-xs font-medium text-foreground">
                      <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{landlord.business_name}</span>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <VerificationBadge status={landlord.verification_status} />
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              {/* Left Column: Stats & Contact */}
              <div className="flex-1 space-y-2">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                    <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Properties</div>
                    <div className="text-xs font-bold text-foreground">{landlord.total_properties || 0}</div>
                  </div>

                  <div className="text-center p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <Home className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mx-auto mb-0.5" />
                    <div className="text-[10px] text-muted-foreground leading-tight">Units</div>
                    <div className="text-xs font-bold text-foreground">{landlord.total_units || 0}</div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-muted/40 rounded-lg p-2 border border-muted/60 space-y-1">
                  {landlord.phone_number && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{landlord.phone_number}</span>
                    </div>
                  )}
                  {landlord.mobile_money_number && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CreditCard className="h-3 w-3 flex-shrink-0" />
                      <span>{landlord.mobile_money_provider}: {landlord.mobile_money_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Commission & Rating */}
              <div className="lg:w-48 space-y-2 flex-shrink-0">
                {/* Commission */}
                <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground font-medium">Commission</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{landlord.commission_rate}%</span>
                  </div>
                  {landlord.payment_schedule && (
                    <div className="text-[10px] text-muted-foreground capitalize">{landlord.payment_schedule}</div>
                  )}
                </div>

                {/* Rating */}
                {landlord.rating && landlord.rating > 0 && (
                  <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-semibold">{landlord.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Landlord Row Component with expandable details
function LandlordRow({ 
  landlord, 
  isExpanded, 
  onToggleExpand, 
  onEdit, 
  onDelete,
  details,
  loadingDetails,
  onRefresh
}: {
  landlord: LandlordProfile
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  details?: any
  loadingDetails?: boolean
  onRefresh: () => void
}) {
  const supabase = createClient()

  const handleUpdateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("landlord_profiles")
      .update({ status: newStatus })
      .eq("id", landlord.id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success("Status updated successfully")
      onRefresh()
    }
  }

  const handleUpdateVerification = async (newStatus: string) => {
    const { error } = await supabase
      .from("landlord_profiles")
      .update({ 
        verification_status: newStatus,
        verification_date: newStatus === 'verified' ? new Date().toISOString() : null
      })
      .eq("id", landlord.id)

    if (error) {
      toast.error("Failed to update verification status")
    } else {
      toast.success("Verification status updated successfully")
      onRefresh()
    }
  }

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggleExpand}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{landlord.profiles?.full_name || "N/A"}</div>
              <div className="text-sm text-muted-foreground">{landlord.profiles?.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{landlord.business_name || "—"}</div>
          {landlord.business_registration_number && (
            <div className="text-xs text-muted-foreground">Reg: {landlord.business_registration_number}</div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            {landlord.phone_number && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3" />
                {landlord.phone_number}
              </div>
            )}
            {landlord.mobile_money_number && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                {landlord.mobile_money_provider}: {landlord.mobile_money_number}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{landlord.total_properties || 0}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{landlord.total_units || 0}</span>
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={landlord.status} />
        </TableCell>
        <TableCell>
          <VerificationBadge status={landlord.verification_status} />
        </TableCell>
        <TableCell>
          <div className="font-medium">{landlord.commission_rate}%</div>
          <div className="text-xs text-muted-foreground">{landlord.payment_schedule}</div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus('active'); }}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus('suspended'); }}>
                <Ban className="h-4 w-4 mr-2 text-orange-600" />
                Suspend
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateVerification('verified'); }}>
                <ShieldCheck className="h-4 w-4 mr-2 text-blue-600" />
                Verify
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateVerification('rejected'); }}>
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                Reject Verification
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30 p-6">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <LandlordDetailsView landlord={landlord} details={details} />
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// Landlord Details View
function LandlordDetailsView({ landlord, details }: { landlord: LandlordProfile; details?: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="properties">Properties ({details?.properties?.length || 0})</TabsTrigger>
        <TabsTrigger value="payments">Payments ({details?.payments?.length || 0})</TabsTrigger>
        <TabsTrigger value="documents">Documents ({details?.documents?.length || 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{landlord.profiles?.full_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{landlord.profiles?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{landlord.phone_number || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alternative Phone:</span>
                <span className="font-medium">{landlord.alternative_phone || "N/A"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span className="font-medium">{landlord.business_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration No:</span>
                <span className="font-medium">{landlord.business_registration_number || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium">{landlord.business_address || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City/District:</span>
                <span className="font-medium">{landlord.city || "N/A"}, {landlord.district || "N/A"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Banking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-medium">{landlord.bank_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-medium">{landlord.bank_account_number || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Name:</span>
                <span className="font-medium">{landlord.bank_account_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mobile Money:</span>
                <span className="font-medium">
                  {landlord.mobile_money_provider ? `${landlord.mobile_money_provider}: ${landlord.mobile_money_number}` : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Properties:</span>
                <span className="font-semibold">{landlord.total_properties || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Units:</span>
                <span className="font-semibold">{landlord.total_units || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupied Units:</span>
                <span className="font-semibold">{landlord.occupied_units || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission Rate:</span>
                <span className="font-semibold">{landlord.commission_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {landlord.rating || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {landlord.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{landlord.notes}</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="properties">
        <Card>
          <CardContent className="pt-6">
            {details?.properties && details.properties.length > 0 ? (
              <div className="space-y-4">
                {details.properties.map((property: any) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-muted-foreground">{property.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(property.price_ugx)}</div>
                      <Badge variant={property.is_active ? "default" : "secondary"}>
                        {property.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No properties found</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card>
          <CardContent className="pt-6">
            {details?.payments && details.payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.period_start).toLocaleDateString()} - {new Date(payment.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(payment.amount_ugx)}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payments found</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardContent className="pt-6">
            {details?.documents && details.documents.length > 0 ? (
              <div className="space-y-3">
                {details.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{doc.document_name}</div>
                        <div className="text-sm text-muted-foreground">{doc.document_type}</div>
                      </div>
                    </div>
                    <Badge variant={doc.is_verified ? "default" : "secondary"}>
                      {doc.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No documents found</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    active: { variant: "default", icon: CheckCircle, label: "Active" },
    pending: { variant: "secondary", icon: Clock, label: "Pending" },
    inactive: { variant: "outline", icon: XCircle, label: "Inactive" },
    suspended: { variant: "destructive", icon: AlertTriangle, label: "Suspended" },
    blacklisted: { variant: "destructive", icon: Ban, label: "Blacklisted" }
  }

  const config = variants[status] || variants.pending
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// Verification Badge Component
function VerificationBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; icon: any; label: string }> = {
    verified: { variant: "default", icon: ShieldCheck, label: "Verified" },
    pending: { variant: "secondary", icon: Clock, label: "Pending" },
    unverified: { variant: "outline", icon: AlertTriangle, label: "Unverified" },
    rejected: { variant: "destructive", icon: XCircle, label: "Rejected" }
  }

  const config = variants[status] || variants.unverified
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// Landlord Dialog for Create/Edit
function LandlordDialog({ 
  landlord, 
  onClose, 
  onSave,
  isOpen,
  setIsOpen
}: { 
  landlord: LandlordProfile | null
  onClose: () => void
  onSave: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    // Auth fields (only for new landlords)
    email: landlord?.email || "",
    password: "",
    full_name: landlord?.full_name || "",
    
    // Profile fields
    phone: landlord?.phone || "",
    national_id: landlord?.national_id || "",
    address: landlord?.address || "",
    city: landlord?.city || "",
    country: landlord?.country || "Uganda",
    
    // Banking fields
    bank_name: landlord?.bank_name || "",
    bank_account_number: landlord?.bank_account_number || "",
    bank_account_name: landlord?.bank_account_name || "",
    mobile_money_number: landlord?.mobile_money_number || "",
    mobile_money_provider: landlord?.mobile_money_provider || "MTN",
    
    // Business fields
    tax_id: landlord?.tax_id || "",
    business_registration_number: landlord?.business_registration_number || "",
    
    // Settings
    commission_rate: landlord?.commission_rate || 10,
    payment_terms: landlord?.payment_terms || "monthly",
    status: landlord?.status || "active",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (landlord) {
        // Update existing landlord
        const supabase = createClient()
        const { error } = await supabase
          .from("landlord_profiles")
          .update({
            phone: formData.phone,
            national_id: formData.national_id,
            address: formData.address,
            city: formData.city,
            country: formData.country,
            bank_name: formData.bank_name,
            bank_account_number: formData.bank_account_number,
            bank_account_name: formData.bank_account_name,
            mobile_money_number: formData.mobile_money_number,
            mobile_money_provider: formData.mobile_money_provider,
            tax_id: formData.tax_id,
            business_registration_number: formData.business_registration_number,
            commission_rate: formData.commission_rate,
            payment_terms: formData.payment_terms,
            status: formData.status,
          })
          .eq("id", landlord.id)

        if (error) {
          console.error("Error updating landlord:", error)
          throw new Error(error.message || "Failed to update landlord")
        }
        toast.success("Landlord updated successfully")
      } else {
        // Create new landlord via API
        // Validate required fields
        if (!formData.email || !formData.password || !formData.full_name) {
          toast.error("Email, password, and full name are required")
          setIsLoading(false)
          return
        }

        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters")
          setIsLoading(false)
          return
        }

        const response = await fetch("/api/admin/landlords/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create landlord")
        }

        toast.success("Landlord account created successfully! They can now sign in.")
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Error saving landlord:", error)
      toast.error(error.message || "Failed to save landlord")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) onClose()
    }}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Landlord
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{landlord ? "Edit Landlord" : "Add New Landlord"}</DialogTitle>
          <DialogDescription>
            {landlord ? "Update landlord information" : "Create a new landlord profile"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {!landlord && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-red-600">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="landlord@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used for login
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-red-600">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-red-600">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={!!landlord}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+256700000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    placeholder="CM12345678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Kampala"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Uganda"
                  />
                </div>
              </div>

            </TabsContent>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="TIN123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_registration_number">Business Registration Number</Label>
                  <Input
                    id="business_registration_number"
                    value={formData.business_registration_number}
                    onChange={(e) => setFormData({ ...formData, business_registration_number: e.target.value })}
                    placeholder="BRN123456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Banking Information Tab */}
            <TabsContent value="banking" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Stanbic Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Bank Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Bank Account Name</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-4">Mobile Money</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile_money_provider">Provider</Label>
                    <Select
                      value={formData.mobile_money_provider}
                      onValueChange={(value) => setFormData({ ...formData, mobile_money_provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="Airtel">Airtel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_money_number">Mobile Money Number</Label>
                    <Input
                      id="mobile_money_number"
                      value={formData.mobile_money_number}
                      onChange={(e) => setFormData({ ...formData, mobile_money_number: e.target.value })}
                      placeholder="+256700000000"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_rate || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                    setFormData({ ...formData, commission_rate: isNaN(value) ? 0 : value })
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Platform commission on rental income (e.g., 10 for 10%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often commission payments are processed
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {landlord ? "Update" : "Create"} Landlord
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
