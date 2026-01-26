import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"
import { Calendar, Clock } from "lucide-react"

export function BookingList({ initialBookings }: { initialBookings: any[] }) {
  if (initialBookings.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center h-48 md:h-64 text-center p-6">
          <p className="text-sm md:text-base text-muted-foreground mb-4">You don't have any bookings yet.</p>
          <a href="/properties">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent px-4 py-2 text-xs md:text-sm">
              Browse Properties
            </Badge>
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {initialBookings.map((booking) => {
        const isVisit = booking.booking_type === 'visit'
        const property = booking.properties
        
        return (
          <Card key={booking.id} className="overflow-hidden border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start md:items-center gap-3 md:gap-4 p-3 md:p-4">
              <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={property?.image_url || "/placeholder.svg?height=100&width=100&query=modern+house"}
                  alt={property?.title || "Property"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start md:items-center justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm md:text-base truncate">{property?.title || "Property"}</h4>
                  <div className="flex gap-1 shrink-0">
                    {isVisit && (
                      <Badge variant="outline" className="text-xs">
                        Visit
                      </Badge>
                    )}
                    <Badge 
                      variant={booking.status === "confirmed" ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{property?.location || "N/A"}</p>
                
                {isVisit ? (
                  // Visit booking details
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.visit_date ? formatDateConsistent(booking.visit_date) : "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.visit_time || "N/A"}
                    </span>
                    {property?.price_ugx && (
                      <span className="font-medium text-foreground text-sm md:text-base">
                        {formatPrice(property.price_ugx)}/month
                      </span>
                    )}
                  </div>
                ) : (
                  // Rental booking details
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {booking.check_in ? formatDateConsistent(booking.check_in) : "N/A"} — {booking.check_out ? formatDateConsistent(booking.check_out) : "N/A"}
                    </span>
                    <span className="font-medium text-foreground text-sm md:text-base">
                      {booking.total_price_ugx ? formatPrice(booking.total_price_ugx) : "N/A"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
