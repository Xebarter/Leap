"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"
import { Search, Download, Eye } from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
  tenant_id: string
  property_id: string
  invoice_date: string
  due_date: string
  total_amount_ugx: number
  amount_paid_ugx: number
  status: string
}

interface Payment {
  id: string
  transaction_id: string
  invoice_id?: string
  amount_paid_ugx: number
  payment_date: string
  status: string
  payment_method: string
}

interface Refund {
  id: string
  refund_id: string
  payment_transaction_id: string
  refund_amount_ugx: number
  refund_date: string
  status: string
  reason: string
}

interface PaymentsDashboardProps {
  invoices: Invoice[]
  payments: Payment[]
  refunds: Refund[]
}

export function PaymentsDashboard({ 
  invoices = [], 
  payments = [], 
  refunds = [] 
}: PaymentsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("invoices")

  // Calculate summary statistics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount_ugx, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid_ugx, 0)
  const totalOutstanding = totalInvoiced - totalPaid
  const totalRefunded = refunds.reduce((sum, ref) => sum + ref.refund_amount_ugx, 0)

  // Filter invoices
  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.tenant_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter payments
  const filteredPayments = payments.filter(pay =>
    pay.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pay.invoice_id && pay.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Filter refunds
  const filteredRefunds = refunds.filter(ref =>
    ref.refund_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
      partially_paid: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return variants[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalInvoiced)}</div>
            <p className="text-xs text-muted-foreground">All invoices issued</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Amount due</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatPrice(totalRefunded)}</div>
            <p className="text-xs text-muted-foreground">Refunds processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card className="bg-card border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>Manage invoices, payments, and refunds</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices, transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">
                Invoices ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="payments">
                Payments ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="refunds">
                Refunds ({refunds.length})
              </TabsTrigger>
            </TabsList>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{formatDateConsistent(invoice.invoice_date)}</TableCell>
                          <TableCell>{formatDateConsistent(invoice.due_date)}</TableCell>
                          <TableCell>{formatPrice(invoice.total_amount_ugx)}</TableCell>
                          <TableCell className="text-green-600">{formatPrice(invoice.amount_paid_ugx)}</TableCell>
                          <TableCell className="text-red-600">
                            {formatPrice(invoice.total_amount_ugx - invoice.amount_paid_ugx)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{payment.transaction_id}</TableCell>
                          <TableCell>{payment.invoice_id || "N/A"}</TableCell>
                          <TableCell className="text-green-600">{formatPrice(payment.amount_paid_ugx)}</TableCell>
                          <TableCell>{formatDateConsistent(payment.payment_date)}</TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Refunds Tab */}
            <TabsContent value="refunds" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Refund ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.length > 0 ? (
                      filteredRefunds.map((refund) => (
                        <TableRow key={refund.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{refund.refund_id}</TableCell>
                          <TableCell className="text-purple-600">{formatPrice(refund.refund_amount_ugx)}</TableCell>
                          <TableCell>{formatDateConsistent(refund.refund_date)}</TableCell>
                          <TableCell className="max-w-xs truncate">{refund.reason}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(refund.status)}>
                              {refund.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No refunds found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
