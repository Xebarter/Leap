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
  const { toast } = useToast()

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

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Occupied Properties</CardTitle>
          <CardDescription>
            {properties.length} properties currently occupied
          </CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No occupied properties at the moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Months Paid</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-muted-foreground">{property.location}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {property.property_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{property.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(property.occupancy_start_date)}</TableCell>
                    <TableCell>{formatDate(property.occupancy_end_date)}</TableCell>
                    <TableCell>{getStatusBadge(property.occupancy_end_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{property.paid_months} months</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowExtendDialog(true)
                          }}
                          disabled={!property.can_extend_occupancy}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            fetchHistory(property.id)
                            setSelectedProperty(property)
                            setShowHistoryDialog(true)
                          }}
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedProperty(property)
                            setShowCancelDialog(true)
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
