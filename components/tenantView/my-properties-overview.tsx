import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"
import { MapPin, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  title: string
  location: string
  image_url: string
  price_ugx: number
  property_type: string
}

interface Occupancy {
  id: string
  property_id: string
  status: string
  start_date: string
  end_date: string
  months_paid: number
  amount_paid_ugx: number
  properties: Property
}

export function MyPropertiesOverview({ occupancies }: { occupancies: Occupancy[] }) {
  if (occupancies.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center h-48 md:h-64 text-center p-6">
          <p className="text-sm md:text-base text-muted-foreground mb-4">You don't have any active properties yet.</p>
          <Link href="/properties">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent px-4 py-2 text-xs md:text-sm">
              Browse Properties
            </Badge>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
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

  return (
    <div className="space-y-3 md:space-y-4">
      {occupancies.map((occupancy) => {
        const property = occupancy.properties
        const daysRemaining = getDaysRemaining(occupancy.end_date)
        
        return (
          <Card key={occupancy.id} className="overflow-hidden border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start md:items-center gap-3 md:gap-4 p-3 md:p-4">
              <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={property?.image_url || "/placeholder.svg?height=100&width=100&query=modern+house"}
                  alt={property?.title || "Property"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start md:items-center justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm md:text-base truncate">{property?.title || "Property"}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {property?.location || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {getStatusBadge(occupancy.status)}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs md:text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Monthly Rent</p>
                      <p className="font-semibold">{formatPrice(property?.price_ugx)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Days Remaining</p>
                      <p className={`font-semibold ${daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                        {daysRemaining} days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateConsistent(occupancy.end_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
      
      {occupancies.length > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" asChild>
            <Link href="/tenant/properties" className="gap-2">
              View All Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
