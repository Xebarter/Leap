import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, Mail, Home, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default async function TenantVisitsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch visit bookings for the user
  const { data: visits } = await supabase
    .from("bookings")
    .select(`
      *,
      properties (
        id,
        title,
        location,
        image_url,
        price_ugx
      )
    `)
    .eq("booking_type", "visit")
    .or(`tenant_id.eq.${user.id},visitor_email.eq.${user.email}`)
    .order("visit_date", { ascending: true })

  // Separate visits into upcoming and past
  const today = new Date().toISOString().split('T')[0]
  const upcomingVisits = visits?.filter(v => v.visit_date >= today) || []
  const pastVisits = visits?.filter(v => v.visit_date < today) || []

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Pending", icon: AlertCircle },
      confirmed: { variant: "default", label: "Confirmed", icon: CheckCircle2 },
      completed: { variant: "outline", label: "Completed", icon: CheckCircle2 },
      cancelled: { variant: "destructive", label: "Cancelled", icon: XCircle },
    }
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const VisitCard = ({ visit }: { visit: any }) => {
    const property = visit.properties
    const visitDateTime = `${format(new Date(visit.visit_date), "EEEE, MMMM d, yyyy")} at ${visit.visit_time}`

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Property Image */}
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {property?.image_url ? (
                <img
                  src={property.image_url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Visit Details */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{property?.title || "Property"}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {property?.location}
                  </div>
                </div>
                {getStatusBadge(visit.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(visit.visit_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{visit.visit_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{visit.visitor_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{visit.visitor_email}</span>
                </div>
              </div>

              {visit.visit_notes && (
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">Your Notes:</p>
                  <p className="text-muted-foreground">{visit.visit_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Link href={`/properties/${property?.id}`}>
                  <Button variant="outline" size="sm">
                    View Property
                  </Button>
                </Link>
                {visit.status === "pending" && (
                  <Button variant="ghost" size="sm" className="text-destructive">
                    Cancel Visit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Property Visits</h1>
        <p className="text-muted-foreground mt-2">View and manage your scheduled property visits</p>
      </div>

      {/* Upcoming Visits */}
      <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Visits</h2>
            {upcomingVisits.length > 0 ? (
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <VisitCard key={visit.id} visit={visit} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No upcoming visits scheduled</p>
                  <Link href="/properties">
                    <Button className="mt-4">Browse Properties</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

      {/* Past Visits */}
      {pastVisits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Visits</h2>
          <div className="space-y-4">
            {pastVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
