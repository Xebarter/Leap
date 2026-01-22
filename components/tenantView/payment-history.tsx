"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"
import { Download, Calendar, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react"

export function PaymentHistory({ payments }: { payments: any[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "refunded":
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (payments.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">No payment transactions recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment History</h3>

      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id} className="border-none shadow-none bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="pt-1">{getStatusIcon(payment.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{payment.payment_method}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateConsistent(payment.payment_date)}</span>
                        </div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    {payment.description && (
                      <p className="text-sm text-muted-foreground mt-2">{payment.description}</p>
                    )}
                    {payment.transaction_id && (
                      <p className="text-xs text-muted-foreground mt-1">ID: {payment.transaction_id}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg">{formatPrice(payment.amount_paid_ugx)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 mt-2">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
