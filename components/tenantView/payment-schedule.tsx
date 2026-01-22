"use client"

import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Calendar, Clock } from "lucide-react"

export function PaymentSchedule({ schedules }: { schedules: any[] }) {
  if (schedules.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">No payment schedules set up</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment Schedules</h3>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="border-none shadow-none bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{schedule.schedule_name}</p>
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground">{schedule.description}</p>
                    )}
                  </div>
                  <Badge variant={schedule.is_active ? "default" : "secondary"}>
                    {schedule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">{formatPrice(schedule.amount_ugx)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Frequency</p>
                    <p className="font-medium">{schedule.frequency}</p>
                  </div>
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Next: {formatDateConsistent(schedule.next_payment_date)}</span>
                  </div>
                  {schedule.auto_payment_enabled && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Auto Pay Enabled</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
