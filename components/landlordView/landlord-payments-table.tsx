import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateConsistent } from "@/lib/date-utils"
import { formatPrice } from "@/lib/utils"

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800">completed</Badge>
    case "pending":
    case "processing":
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    case "failed":
      return <Badge className="bg-red-100 text-red-800">failed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function LandlordPaymentsTable({ payments, invoices }: { payments: any[]; invoices: any[] }) {
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount_paid_ugx || 0), 0)

  const totalOutstanding = invoices
    .filter((i) => ["sent", "overdue", "partially_paid"].includes(i.status))
    .reduce((sum, i) => sum + (i.amount_balance_ugx || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding (Invoices)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.payment_date ? formatDateConsistent(p.payment_date) : "-"}</TableCell>
                  <TableCell className="font-medium">{p.profiles?.full_name || p.profiles?.email || "Tenant"}</TableCell>
                  <TableCell>{p.payment_method || "-"}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">{formatPrice(p.amount_paid_ugx)}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No payment transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoice_number}</TableCell>
                  <TableCell>{i.profiles?.full_name || i.profiles?.email || "Tenant"}</TableCell>
                  <TableCell>{statusBadge(i.status)}</TableCell>
                  <TableCell>{i.due_date ? formatDateConsistent(i.due_date) : "-"}</TableCell>
                  <TableCell className="text-right">{formatPrice(i.amount_balance_ugx)}</TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
