"use client"

import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Download, AlertCircle, CheckCircle2, Clock } from "lucide-react"

export function InvoicesList({ invoices }: { invoices: any[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "partially_paid":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case "partially_paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-800">Refunded</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (invoices.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">No invoices yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Invoices</h3>

      {invoices.map((invoice) => (
        <Card key={invoice.id} className="border-none shadow-none bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="pt-1">{getStatusIcon(invoice.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">Invoice {invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDateConsistent(invoice.due_date)}
                      </p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <span>Total: {formatPrice(invoice.total_amount_ugx)}</span>
                    <span>Paid: {formatPrice(invoice.amount_paid_ugx)}</span>
                    {invoice.amount_balance_ugx > 0 && (
                      <span className="text-orange-600 font-medium">
                        Balance: {formatPrice(invoice.amount_balance_ugx)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
