import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"

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
      {initialBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden border-none shadow-sm bg-card hover:shadow-md transition-shadow">
          <div className="flex items-start md:items-center gap-3 md:gap-4 p-3 md:p-4">
            <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={booking.properties?.image_url || "/placeholder.svg?height=100&width=100&query=modern+house"}
                alt={booking.properties?.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start md:items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm md:text-base truncate">{booking.properties?.title}</h4>
                <Badge 
                  variant={booking.status === "confirmed" ? "default" : "secondary"} 
                  className="text-xs shrink-0"
                >
                  {booking.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{booking.properties?.location}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {formatDateConsistent(booking.check_in)} — {formatDateConsistent(booking.check_out)}
                </span>
                <span className="font-medium text-foreground text-sm md:text-base">{formatPrice(booking.total_price)}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
