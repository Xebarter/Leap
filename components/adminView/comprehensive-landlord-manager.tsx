"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { EnhancedLandlordDialog } from "./enhanced-landlord-dialog"
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

function AssignResourcesSection({ landlords, onAssigned }: { landlords: any[]; onAssigned: () => void }) {
  const supabase = createClient()
  const [scope, setScope] = useState<'building' | 'unit_type' | 'unit'>('building')
  const [selectedLandlord, setSelectedLandlord] = useState<string>('')
  const [blocks, setBlocks] = useState<any[]>([])
  const [blockId, setBlockId] = useState<string>('')
  const [unitTypes, setUnitTypes] = useState<string[]>([])
  const [unitType, setUnitType] = useState<string>('')
  const [units, setUnits] = useState<any[]>([])
  const [unitId, setUnitId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBlocks = async () => {
      const { data } = await supabase.from('property_blocks').select('id,name,location').order('name')
      setBlocks(data || [])
    }
    fetchBlocks()
  }, [])

  useEffect(() => {
    const fetchUnitTypesAndUnits = async () => {
      if (!blockId) {
        setUnitTypes([])
        setUnits([])
        setUnitType('')
        setUnitId('')
        return
      }
      const { data: unitRows } = await supabase
        .from('property_units')
        .select('id, unit_type, unit_number')
        .eq('block_id', blockId)
        .order('unit_type')
      const types = Array.from(new Set((unitRows || []).map((u: any) => u.unit_type).filter(Boolean))) as string[]
      setUnitTypes(types)
      setUnits(unitRows || [])
      if (!types.includes(unitType)) setUnitType('')
      if (!unitRows?.find(u => u.id === unitId)) setUnitId('')
    }
    fetchUnitTypesAndUnits()
  }, [blockId])

  const handleAssign = async (assignToNull = false) => {
    try {
      setLoading(true)
      const body: any = {
        landlordId: assignToNull ? null : (selectedLandlord || null),
        scope,
      }
      if (scope === 'building') {
        if (!blockId) return toast.error('Please select a building')
        body.blockId = blockId
      } else if (scope === 'unit_type') {
        if (!blockId || !unitType) return toast.error('Please select building and unit type')
        body.blockId = blockId
        body.unitType = unitType
      } else if (scope === 'unit') {
        if (!unitId) return toast.error('Please select a unit')
        body.unitId = unitId
      }
      const res = await fetch('/api/admin/landlords/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to assign')
      toast.success('Assignment updated')
      onAssigned()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label>Scope</Label>
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="unit_type">Unit Type</SelectItem>
              <SelectItem value="unit">Single Unit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Landlord</Label>
          <Select value={selectedLandlord} onValueChange={(v) => setSelectedLandlord(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select landlord" />
            </SelectTrigger>
            <SelectContent>
              {landlords.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.profiles?.full_name || l.business_name || 'Landlord'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Building</Label>
          <Select value={blockId} onValueChange={(v) => setBlockId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select building" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name || 'Block'}{b.location ? ` • ${b.location}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {scope !== 'building' && (
          <div className="space-y-1">
            <Label>{scope === 'unit_type' ? 'Unit Type' : 'Unit'}</Label>
            {scope === 'unit_type' ? (
              <Select value={unitType} onValueChange={(v) => setUnitType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={unitId} onValueChange={(v) => setUnitId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.unit_number} • {u.unit_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => handleAssign(false)} disabled={loading}>
          Assign
        </Button>
        <Button variant="outline" onClick={() => handleAssign(true)} disabled={loading}>
          Remove Assignment
        </Button>
      </div>
    </div>
  )
}

export function ComprehensiveLandlordManager({ initialLandlords }: { initialLandlords: LandlordProfile[] }) {
  // helper subcomponent declared below
  // helper subcomponent declared below

  // helper subcomponent declared below

  const [landlords, setLandlords] = useState<LandlordProfile[]>(initialLandlords)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [initialActiveTab, setInitialActiveTab] = useState<string>('basic')
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
      // Fetch properties (property-level assignments)
      const { data: properties } = await supabase
        .from("properties")
        .select("id, title, location, price_ugx, is_active, block_id")
        .eq("landlord_id", landlordId)

      // Fetch units (unit-level assignments)
      const { data: assignedUnits } = await supabase
        .from("property_units")
        .select(`
          id,
          unit_number,
          unit_type,
          block_id,
          property_id,
          property:property_id (title),
          block:block_id (name, location)
        `)
        .eq("landlord_id", landlordId)
        .order("unit_type")

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
        [landlordId]: { properties, assignedUnits, payments, documents }
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
            <Button onClick={() => { setEditingLandlord(null); setInitialActiveTab('basic'); setIsOpen(true) }} className="sm:w-auto">
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

      {/* Enhanced Landlord Dialog */}
      <EnhancedLandlordDialog
        landlord={editingLandlord}
        isOpen={isOpen}
        onClose={() => {
          setEditingLandlord(null)
          setIsOpen(false)
        }}
        onSave={refreshLandlords}
        initialActiveTab={initialActiveTab}
        onCreated={(id: string) => {
          // After creation, refresh and reopen on Assignments tab
          (async () => {
            await refreshLandlords()
            const justCreated = (await createClient())
              .from('landlord_profiles')
              .select('id, user_id')
              .eq('id', id)
              .maybeSingle()
            setEditingLandlord(landlords.find(l => l.id === id) || null)
            setInitialActiveTab('assignments')
            setIsOpen(true)
          })()
        }}
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
        <TabsTrigger value="assignments">Assignments ({(details?.properties?.length || 0) + (details?.assignedUnits?.length || 0)})</TabsTrigger>
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
                <span className="text-muted-foreground">Total Properties (assigned):</span>
                <span className="font-semibold">{(details?.properties?.length || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned Units:</span>
                <span className="font-semibold">{details?.assignedUnits?.length || 0}</span>
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
          <CardContent className="pt-6 space-y-6">
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

// Legacy LandlordDialog removed - now using enhanced-landlord-dialog.tsx
