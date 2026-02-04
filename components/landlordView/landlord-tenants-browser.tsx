'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateConsistent } from '@/lib/date-utils'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CreditCard, FileText, Search, User, Wrench, AlertTriangle, FolderOpen } from 'lucide-react'

export type LandlordTenantRow = {
  tenantId: string
  fullName: string
  email: string
  phoneNumber?: string | null
  tenantNumber?: string | null
  verificationStatus?: string | null

  activeBookingsCount: number
  totalBookingsCount: number

  totalPaidUgx: number
  outstandingUgx: number
  lastPaymentDate?: string | null

  bookings: any[]
  invoices: any[]
  payments: any[]

  complaints: any[]
  maintenance: any[]
  documents: any[]
}

function initialFromName(name: string) {
  const safe = (name || '').trim()
  if (!safe) return 'T'
  return safe
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'paid':
    case 'completed':
    case 'resolved':
      return <Badge className="bg-green-100 text-green-800">{status}</Badge>
    case 'overdue':
    case 'pending':
    case 'partially_paid':
    case 'in_progress':
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    case 'cancelled':
    case 'failed':
    case 'closed':
      return <Badge className="bg-red-100 text-red-800">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function LandlordTenantsBrowser({ tenants }: { tenants: LandlordTenantRow[] }) {
  const [query, setQuery] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(tenants[0]?.tenantId ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tenants
    return tenants.filter((t) => {
      return (
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.phoneNumber || '').toLowerCase().includes(q) ||
        (t.tenantNumber || '').toLowerCase().includes(q)
      )
    })
  }, [query, tenants])

  const selected = useMemo(() => {
    return tenants.find((t) => t.tenantId === selectedTenantId) ?? null
  }, [selectedTenantId, tenants])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
      {/* Left: Tenant list */}
      <Card className="border-none shadow-sm bg-card lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tenants</CardTitle>
          <CardDescription>Tenants currently associated with your property units.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenant name, email, phone..."
              className="pl-10 bg-background/50 backdrop-blur-sm"
            />
          </div>

          <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
            {filtered.map((t) => {
              const isActive = t.tenantId === selectedTenantId
              return (
                <button
                  key={t.tenantId}
                  type="button"
                  onClick={() => setSelectedTenantId(t.tenantId)}
                  className={cn(
                    'w-full text-left rounded-xl border border-border/50 p-3 transition-all',
                    isActive
                      ? 'bg-primary/5 border-primary/30 shadow-sm'
                      : 'bg-muted/20 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {initialFromName(t.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">{t.fullName}</p>
                        {t.outstandingUgx > 0 ? (
                          <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-700">
                            {formatPrice(t.outstandingUgx)} due
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-700">
                            settled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {t.activeBookingsCount} active
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {t.totalBookingsCount} bookings
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground p-3">No tenants match your search.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Details */}
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        {!selected ? (
          <Card className="border-none shadow-sm bg-card">
            <CardContent className="p-10 text-center text-muted-foreground">
              Select a tenant to view details.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xl truncate">{selected.fullName}</CardTitle>
                      <CardDescription className="truncate">{selected.email}</CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selected.tenantNumber && (
                          <Badge variant="outline" className="text-xs font-mono bg-background/50">
                            Tenant ID: {selected.tenantNumber}
                          </Badge>
                        )}
                        {selected.verificationStatus && (
                          <Badge variant="secondary" className="text-xs">
                            {selected.verificationStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full sm:w-auto">
                    <Card className="border-none shadow-sm bg-background/50">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">Total Paid</p>
                        <p className="text-lg font-bold">{formatPrice(selected.totalPaidUgx)}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-background/50">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className={cn('text-lg font-bold', selected.outstandingUgx > 0 ? 'text-orange-700' : 'text-green-700')}>
                          {formatPrice(selected.outstandingUgx)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 text-sm">
                  {selected.phoneNumber && (
                    <Badge variant="outline" className="bg-background/50">
                      {selected.phoneNumber}
                    </Badge>
                  )}
                  <Badge variant="secondary">{selected.activeBookingsCount} active bookings</Badge>
                  {selected.lastPaymentDate && (
                    <Badge variant="secondary">Last payment: {formatDateConsistent(selected.lastPaymentDate)}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="payments" className="space-y-4">
              <TabsList className="bg-gradient-to-r from-muted/80 to-muted/50 backdrop-blur-sm p-1.5 rounded-xl overflow-x-auto w-full flex justify-start shadow-sm border border-border/50">
                <TabsTrigger value="payments" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-2">
                  <User className="w-4 h-4" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="complaints" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Complaints
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="gap-2">
                  <Wrench className="w-4 h-4" />
                  Maintenance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payments">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>All transactions for this tenant on your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.payment_date ? formatDateConsistent(p.payment_date) : '-'}</TableCell>
                            <TableCell>{p.payment_method || '-'}</TableCell>
                            <TableCell>{statusBadge(p.status)}</TableCell>
                            <TableCell className="text-right">{formatPrice(p.amount_paid_ugx)}</TableCell>
                          </TableRow>
                        ))}
                        {selected.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              No payment transactions found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invoices">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>Invoices issued for this tenant on your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.invoices.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="font-medium">{i.invoice_number}</TableCell>
                            <TableCell>{statusBadge(i.status)}</TableCell>
                            <TableCell>{i.due_date ? formatDateConsistent(i.due_date) : '-'}</TableCell>
                            <TableCell className="text-right">{formatPrice(i.total_amount_ugx)}</TableCell>
                            <TableCell className="text-right">{formatPrice(i.amount_balance_ugx)}</TableCell>
                          </TableRow>
                        ))}
                        {selected.invoices.length === 0 && (
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
              </TabsContent>

              <TabsContent value="bookings">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Bookings</CardTitle>
                    <CardDescription>Bookings for this tenant on your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.bookings.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>{statusBadge(b.status)}</TableCell>
                            <TableCell>{b.check_in ? formatDateConsistent(b.check_in) : '-'}</TableCell>
                            <TableCell>{b.check_out ? formatDateConsistent(b.check_out) : '-'}</TableCell>
                            <TableCell className="text-right">{formatPrice(b.total_price_ugx)}</TableCell>
                          </TableRow>
                        ))}
                        {selected.bookings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              No bookings found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Tenant documents (may be hidden if your database RLS does not allow landlord access).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.documents.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>{d.document_type}</TableCell>
                            <TableCell className="font-medium">{d.document_name}</TableCell>
                            <TableCell>{statusBadge(d.status)}</TableCell>
                            <TableCell>{d.created_at ? formatDateConsistent(d.created_at) : '-'}</TableCell>
                          </TableRow>
                        ))}
                        {selected.documents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              No documents found (or access is restricted).
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="complaints">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Complaints</CardTitle>
                    <CardDescription>Complaints raised by this tenant for your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.complaints.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.complaint_type}</TableCell>
                            <TableCell className="font-medium">{c.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{c.priority}</Badge>
                            </TableCell>
                            <TableCell>{statusBadge(c.status)}</TableCell>
                            <TableCell>{c.created_at ? formatDateConsistent(c.created_at) : '-'}</TableCell>
                          </TableRow>
                        ))}
                        {selected.complaints.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">
                              No complaints found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance">
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle>Maintenance Requests</CardTitle>
                    <CardDescription>Maintenance requests raised by this tenant for your properties.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.maintenance.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{m.severity}</Badge>
                            </TableCell>
                            <TableCell>{statusBadge(m.status)}</TableCell>
                            <TableCell>{m.request_date ? formatDateConsistent(m.request_date) : formatDateConsistent(m.created_at)}</TableCell>
                          </TableRow>
                        ))}
                        {selected.maintenance.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              No maintenance requests found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
