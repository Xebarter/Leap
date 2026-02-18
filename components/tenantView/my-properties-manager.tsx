"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  CreditCard, 
  Bell, 
  Wrench, 
  MessageSquare, 
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"

interface Property {
  id: string
  title: string
  location: string
  image_url: string
  price_ugx: number
  property_type: string
  description: string
  bedrooms: number
  bathrooms: number
  landlord_id: string
  profiles: {
    id: string
    full_name: string
    email: string
    phone: string
  }
}

interface Occupancy {
  id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string
  months_paid: number
  amount_paid_ugx: number
  status: 'active' | 'expired' | 'extended' | 'cancelled'
  created_at: string
  properties: Property
}

interface MyPropertiesManagerProps {
  initialOccupancies: Occupancy[]
  userId: string
}

export function MyPropertiesManager({ initialOccupancies, userId }: MyPropertiesManagerProps) {
  const [occupancies, setOccupancies] = useState<Occupancy[]>(initialOccupancies)
  const [selectedProperty, setSelectedProperty] = useState<Occupancy | null>(
    initialOccupancies.find(o => o.status === 'active') || initialOccupancies[0] || null
  )
  const [propertyPayments, setPropertyPayments] = useState<any[]>([])
  const [propertyNotices, setPropertyNotices] = useState<any[]>([])
  const [propertyMaintenance, setPropertyMaintenance] = useState<any[]>([])
  const [propertyComplaints, setPropertyComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Filter occupancies
  const activeOccupancies = occupancies.filter(o => o.status === 'active' || o.status === 'extended')
  const pastOccupancies = occupancies.filter(o => o.status === 'expired' || o.status === 'cancelled')

  // Load property-specific data
  useEffect(() => {
    if (!selectedProperty) return

    const loadPropertyData = async () => {
      setLoading(true)
      try {
        // Fetch payments for this property
        const { data: payments } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("property_id", selectedProperty.property_id)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        // Fetch notices for this property
        const { data: notices } = await supabase
          .from("tenant_notices")
          .select("*")
          .eq("tenant_id", userId)
          .eq("property_id", selectedProperty.property_id)
          .order("created_at", { ascending: false })

        // Fetch maintenance requests for this property
        const { data: maintenance } = await supabase
          .from("maintenance_requests")
          .select("*")
          .eq("tenant_id", userId)
          .eq("property_id", selectedProperty.property_id)
          .order("created_at", { ascending: false })

        // Fetch complaints for this property
        const { data: complaints } = await supabase
          .from("tenant_complaints")
          .select("*")
          .eq("tenant_id", userId)
          .eq("property_id", selectedProperty.property_id)
          .order("created_at", { ascending: false })

        setPropertyPayments(payments || [])
        setPropertyNotices(notices || [])
        setPropertyMaintenance(maintenance || [])
        setPropertyComplaints(complaints || [])
      } catch (error) {
        console.error("Error loading property data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPropertyData()
  }, [selectedProperty, userId, supabase])

  if (occupancies.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't rented any properties yet. Browse available properties to get started.
          </p>
          <Button asChild>
            <a href="/properties">Browse Properties</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Active" },
      extended: { variant: "secondary", label: "Extended" },
      expired: { variant: "destructive", label: "Expired" },
      cancelled: { variant: "outline", label: "Cancelled" },
    }
    const config = variants[status] || variants.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Properties List Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active Properties</CardTitle>
            <CardDescription>
              {activeOccupancies.length} active rental{activeOccupancies.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOccupancies.map((occupancy) => (
              <Card
                key={occupancy.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProperty?.id === occupancy.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProperty(occupancy)}
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={occupancy.properties?.image_url || "/placeholder.svg"}
                        alt={occupancy.properties?.title || "Property"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {occupancy.properties?.title}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {occupancy.properties?.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(occupancy.status)}
                        <span className="text-xs text-muted-foreground">
                          {getDaysRemaining(occupancy.end_date)} days left
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        {pastOccupancies.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Past Properties</CardTitle>
              <CardDescription>
                {pastOccupancies.length} previous rental{pastOccupancies.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastOccupancies.map((occupancy) => (
                <Card
                  key={occupancy.id}
                  className={`cursor-pointer transition-all hover:shadow-md opacity-70 ${
                    selectedProperty?.id === occupancy.id ? 'ring-2 ring-primary opacity-100' : ''
                  }`}
                  onClick={() => setSelectedProperty(occupancy)}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={occupancy.properties?.image_url || "/placeholder.svg"}
                          alt={occupancy.properties?.title || "Property"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {occupancy.properties?.title}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {occupancy.properties?.location}
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(occupancy.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Property Details and Management */}
      <div className="lg:col-span-8">
        {selectedProperty && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="landlord">Landlord</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-none shadow-sm">
                <div className="relative h-64 w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={selectedProperty.properties?.image_url || "/placeholder.svg"}
                    alt={selectedProperty.properties?.title || "Property"}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedProperty.properties?.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <MapPin className="w-4 h-4" />
                        {selectedProperty.properties?.location}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedProperty.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="text-xl font-bold">
                        {formatPrice(selectedProperty.properties?.price_ugx)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Occupancy Period</p>
                      <p className="text-xl font-bold">{selectedProperty.months_paid} months</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Days Remaining</p>
                      <p className="text-xl font-bold">
                        {getDaysRemaining(selectedProperty.end_date)} days
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Lease Period</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDateConsistent(selectedProperty.start_date)} — {formatDateConsistent(selectedProperty.end_date)}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Property Details</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <Badge variant="outline">{selectedProperty.properties?.property_type}</Badge>
                        <Badge variant="outline">{selectedProperty.properties?.bedrooms} Bedrooms</Badge>
                        <Badge variant="outline">{selectedProperty.properties?.bathrooms} Bathrooms</Badge>
                      </div>
                    </div>

                    {selectedProperty.properties?.description && (
                      <div>
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProperty.properties.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    All payments made for this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : propertyPayments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No payments found</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{formatPrice(payment.amount_ugx)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateConsistent(payment.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notices Tab */}
            <TabsContent value="notices" className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Notices</CardTitle>
                  <CardDescription>
                    Important notices for this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : propertyNotices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No notices</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyNotices.map((notice) => (
                        <div
                          key={notice.id}
                          className="p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{notice.title}</h4>
                            <Badge variant="outline">{notice.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notice.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateConsistent(notice.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Maintenance Requests</CardTitle>
                  <CardDescription>
                    Track maintenance issues for this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : propertyMaintenance.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No maintenance requests</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyMaintenance.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                              <Wrench className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{request.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDateConsistent(request.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Complaints Tab */}
            <TabsContent value="complaints" className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Complaints</CardTitle>
                  <CardDescription>
                    Your complaints and feedback for this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : propertyComplaints.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No complaints filed</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyComplaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="flex items-start justify-between p-4 bg-muted/30 rounded-lg"
                        >
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{complaint.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {complaint.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDateConsistent(complaint.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={complaint.status === 'resolved' ? 'default' : 'secondary'}>
                            {complaint.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Landlord Tab */}
            <TabsContent value="landlord" className="space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Landlord Information</CardTitle>
                  <CardDescription>
                    Contact details for your landlord
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedProperty.properties?.profiles && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {selectedProperty.properties.profiles.full_name || 'Landlord'}
                          </h3>
                          <p className="text-sm text-muted-foreground">Property Owner</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedProperty.properties.profiles.email && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <a
                                href={`mailto:${selectedProperty.properties.profiles.email}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {selectedProperty.properties.profiles.email}
                              </a>
                            </div>
                          </div>
                        )}

                        {selectedProperty.properties.profiles.phone && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <a
                                href={`tel:${selectedProperty.properties.profiles.phone}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {selectedProperty.properties.profiles.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full" asChild>
                          <a href={`mailto:${selectedProperty.properties.profiles.email}`}>
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Landlord
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
