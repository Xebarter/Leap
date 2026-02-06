"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Home,
  Calendar,
  User,
  Clock,
  DollarSign,
  Plus,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  History,
  Loader2,
  LayoutGrid,
  List,
  Search,
  MapPin,
  Mail,
  Phone,
  Eye,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Property {
  id: string
  title: string
  location: string
  price_ugx: number
  property_code: string
  is_occupied: boolean
  occupied_by: string
  occupancy_start_date: string
  occupancy_end_date: string
  paid_months: number
  last_payment_date: string
  can_extend_occupancy: boolean
  profiles: {
    id: string
    full_name: string
    email: string
    phone: string
  }
}

interface HistoryItem {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string
  months_paid: number
  amount_paid_ugx: number
  status: string
  original_end_date: string | null
  extension_reason: string | null
  extended_at: string | null
  created_at: string
  property: {
    title: string
    location: string
    property_code: string
  }
  tenant: {
    full_name: string
    email: string
  }
  extender: {
    full_name: string
  } | null
}

export function OccupancyManager() {
  const [properties, setProperties] = useState<Property[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [additionalMonths, setAdditionalMonths] = useState('1')
  const [extensionReason, setExtensionReason] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'expired' | 'active'>('all')
  const { toast } = useToast()

  // Filter properties based on search and status
  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.property_code?.toLowerCase().includes(searchQuery.toLowerCase())

    const daysRemaining = getDaysRemaining(property.occupancy_end_date)
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'expired' && daysRemaining < 0) ||
      (statusFilter === 'expiring' && daysRemaining >= 0 && daysRemaining <= 30) ||
      (statusFilter === 'active' && daysRemaining > 30)

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    fetchOccupiedProperties()
  }, [])

  const fetchOccupiedProperties = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/occupancies')
      const data = await response.json()
      
      if (data.success) {
        setProperties(data.properties || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch occupied properties',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      toast({
        title: 'Error',
        description: 'Failed to load occupied properties',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistory = async (propertyId?: string) => {
    try {
      const url = propertyId 
        ? `/api/admin/occupancies/history?propertyId=${propertyId}`
        : '/api/admin/occupancies/history'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleExtend = async () => {
    if (!selectedProperty) return

    const months = parseInt(additionalMonths)
    if (isNaN(months) || months < 1 || months > 12) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid number of months (1-12)',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/occupancies/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          additionalMonths: months,
          reason: extensionReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success!',
          description: data.message,
        })
        setShowExtendDialog(false)
        setAdditionalMonths('1')
        setExtensionReason('')
        fetchOccupiedProperties()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to extend occupancy',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error extending occupancy:', error)
      toast({
        title: 'Error',
        description: 'Failed to extend occupancy',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedProperty) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/occupancies/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          reason: cancellationReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success!',
          description: data.message,
        })
        setShowCancelDialog(false)
        setCancellationReason('')
        fetchOccupiedProperties()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel occupancy',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cancelling occupancy:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel occupancy',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (endDate: string) => {
    const daysRemaining = getDaysRemaining(endDate)
    
    if (daysRemaining < 0) {
      return <Badge variant="destructive">Expired</Badge>
    } else if (daysRemaining <= 7) {
      return <Badge variant="destructive">Expires in {daysRemaining} days</Badge>
    } else if (daysRemaining <= 30) {
      return <Badge className="bg-yellow-500">Expires in {daysRemaining} days</Badge>
    } else {
      return <Badge variant="default">{daysRemaining} days remaining</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Property Occupancy Management</h2>
          <p className="text-muted-foreground mt-2">
            Manage occupied properties, extend periods, and view history
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOccupiedProperties}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchHistory()
              setShowHistoryDialog(true)
            }}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            View All History
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Occupied</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter(p => getDaysRemaining(p.occupancy_end_date) <= 30).length}
            </div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <X className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {properties.filter(p => getDaysRemaining(p.occupancy_end_date) < 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(properties.reduce((sum, p) => sum + (p.price_ugx / 100) * p.paid_months, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Occupancies Directory</CardTitle>
              <CardDescription>
                Manage occupied properties and extend periods
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                fetchHistory()
                setShowHistoryDialog(true)
              }}
              className="sm:w-auto"
            >
              <History className="w-4 h-4 mr-2" />
              View All History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by property, tenant, or code..."
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
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
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

          {/* Occupancies List/Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No occupancies found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'No occupied properties at the moment'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProperties.map((property) => (
                <OccupancyCard
                  key={property.id}
                  property={property}
                  getDaysRemaining={getDaysRemaining}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  onExtend={() => {
                    setSelectedProperty(property)
                    setShowExtendDialog(true)
                  }}
                  onHistory={() => {
                    fetchHistory(property.id)
                    setSelectedProperty(property)
                    setShowHistoryDialog(true)
                  }}
                  onCancel={() => {
                    setSelectedProperty(property)
                    setShowCancelDialog(true)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <OccupancyListItem
                  key={property.id}
                  property={property}
                  getDaysRemaining={getDaysRemaining}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  onExtend={() => {
                    setSelectedProperty(property)
                    setShowExtendDialog(true)
                  }}
                  onHistory={() => {
                    fetchHistory(property.id)
                    setSelectedProperty(property)
                    setShowHistoryDialog(true)
                  }}
                  onCancel={() => {
                    setSelectedProperty(property)
                    setShowCancelDialog(true)
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Occupancy Period</DialogTitle>
            <DialogDescription>
              Extend the occupancy period for {selectedProperty?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="months">Additional Months</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="12"
                value={additionalMonths}
                onChange={(e) => setAdditionalMonths(e.target.value)}
                placeholder="Enter number of months"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Extension</Label>
              <Textarea
                id="reason"
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Optional: Enter reason for extension"
                rows={3}
              />
            </div>
            {selectedProperty && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current End Date:</span>
                  <span className="font-medium">{formatDate(selectedProperty.occupancy_end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New End Date:</span>
                  <span className="font-medium">
                    {formatDate(
                      new Date(
                        new Date(selectedProperty.occupancy_end_date).getTime() +
                        parseInt(additionalMonths || '0') * 30 * 24 * 60 * 60 * 1000
                      ).toISOString()
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtend} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Extend Occupancy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Occupancy</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the occupancy for {selectedProperty?.title}? This will make the property available immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              No, Keep It
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Yes, Cancel Occupancy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProperty ? `Occupancy History - ${selectedProperty.title}` : 'All Occupancy History'}
            </DialogTitle>
            <DialogDescription>
              View complete history of property occupancies
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No history found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Months</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.property?.title}</div>
                          <div className="text-xs text-muted-foreground">{item.property?.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.tenant?.full_name}</div>
                          <div className="text-xs text-muted-foreground">{item.tenant?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(item.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(item.end_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.months_paid}</TableCell>
                      <TableCell>{formatPrice(item.amount_paid_ugx / 100)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'active' ? 'default' :
                            item.status === 'extended' ? 'default' :
                            item.status === 'expired' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {item.status}
                        </Badge>
                        {item.extended_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Extended by {item.extender?.full_name}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Occupancy Card Component (Grid View)
function OccupancyCard({ property, getDaysRemaining, getStatusBadge, formatDate, onExtend, onHistory, onCancel }: {
  property: Property
  getDaysRemaining: (endDate: string) => number
  getStatusBadge: (endDate: string) => JSX.Element
  formatDate: (dateString: string) => string
  onExtend: () => void
  onHistory: () => void
  onCancel: () => void
}) {
  const daysRemaining = getDaysRemaining(property.occupancy_end_date)
  
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/50 border">
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-3 border-b">
        <div className="flex items-start gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5 line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{property.location}</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {property.property_code}
            </Badge>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-2">
          {getStatusBadge(property.occupancy_end_date)}
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2">
        {/* Tenant Info */}
        <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
          <div className="flex items-center gap-2 text-xs mb-1">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{property.profiles?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.profiles?.email}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
            <div className="text-[10px] text-muted-foreground mb-0.5">Start Date</div>
            <div className="text-xs font-medium">{formatDate(property.occupancy_start_date)}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
            <div className="text-[10px] text-muted-foreground mb-0.5">End Date</div>
            <div className="text-xs font-medium">{formatDate(property.occupancy_end_date)}</div>
          </div>
        </div>

        {/* Months Paid */}
        <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Months Paid</span>
            </div>
            <span className="text-sm font-bold text-primary">{property.paid_months}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <Button 
            variant="default" 
            size="sm"
            onClick={onExtend}
            disabled={!property.can_extend_occupancy}
            className="h-7 text-xs px-2"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onHistory}
            className="h-7 text-xs px-2"
          >
            <History className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Occupancy List Item Component (List View)
function OccupancyListItem({ property, getDaysRemaining, getStatusBadge, formatDate, onExtend, onHistory, onCancel }: {
  property: Property
  getDaysRemaining: (endDate: string) => number
  getStatusBadge: (endDate: string) => JSX.Element
  formatDate: (dateString: string) => string
  onExtend: () => void
  onHistory: () => void
  onCancel: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:border-l-primary">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Icon Section */}
          <div className="relative w-full md:w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0 overflow-hidden group">
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-12 w-12 text-primary/40 group-hover:scale-110 transition-transform" />
            </div>
            {/* Status Badge Overlay */}
            <div className="absolute top-2 right-2">
              {getStatusBadge(property.occupancy_end_date)}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="mb-2.5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-0.5 text-foreground line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-0.5">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono mt-1">
                    {property.property_code}
                  </Badge>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onExtend}
                    disabled={!property.can_extend_occupancy}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onHistory}
                    className="h-7 px-2"
                  >
                    <History className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onCancel}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2.5">
              {/* Left Column: Tenant & Dates */}
              <div className="flex-1 space-y-2">
                {/* Tenant Info */}
                <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{property.profiles?.full_name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span>{property.profiles?.email}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                    <div className="text-[10px] text-muted-foreground mb-0.5">Start Date</div>
                    <div className="text-xs font-medium">{formatDate(property.occupancy_start_date)}</div>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2 border border-muted/60">
                    <div className="text-[10px] text-muted-foreground mb-0.5">End Date</div>
                    <div className="text-xs font-medium">{formatDate(property.occupancy_end_date)}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Months Paid */}
              <div className="lg:w-48 space-y-2 flex-shrink-0">
                <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground font-medium">Months Paid</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">{property.paid_months} months</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
