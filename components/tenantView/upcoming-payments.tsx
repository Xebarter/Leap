import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

export function UpcomingPayments({ bookings = [] }: { bookings: any[] }) {
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")

  return (
    <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg">Upcoming Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confirmedBookings.length > 0 ? (
          confirmedBookings.slice(0, 2).map((booking) => (
            <div key={booking.id} className="flex items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{booking.properties?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Due in 5 days</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm md:text-base font-bold">{formatPrice(booking.total_price)}</p>
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-1">Autopay active</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4">No upcoming payments.</p>
        )}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm md:text-base font-bold p-3 bg-primary/5 rounded-lg">
            <span>Total Outstanding</span>
            <span className="text-primary">{formatPrice(confirmedBookings.reduce((acc, b) => acc + Number(b.total_price), 0))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}