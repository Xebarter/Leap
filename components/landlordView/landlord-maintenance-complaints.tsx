import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateConsistent } from "@/lib/date-utils"

function statusBadge(status: string) {
  switch (status) {
    case "resolved":
    case "completed":
      return <Badge className="bg-green-100 text-green-800">{status}</Badge>
    case "in_progress":
    case "assigned":
    case "open":
    case "pending_review":
      return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
    case "closed":
    case "cancelled":
    case "rejected":
      return <Badge className="bg-red-100 text-red-800">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function LandlordMaintenanceComplaints({ complaints, maintenance }: { complaints: any[]; maintenance: any[] }) {
  return (
    <Tabs defaultValue="complaints" className="space-y-4">
      <TabsList>
        <TabsTrigger value="complaints">Complaints</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
      </TabsList>

      <TabsContent value="complaints">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.profiles?.full_name || c.profiles?.email || "Tenant"}</TableCell>
                    <TableCell>{c.complaint_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.priority}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell>{formatDateConsistent(c.created_at)}</TableCell>
                  </TableRow>
                ))}
                {complaints.length === 0 && (
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
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenance.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{m.profiles?.full_name || m.profiles?.email || "Tenant"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.severity}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell>{m.request_date ? formatDateConsistent(m.request_date) : formatDateConsistent(m.created_at)}</TableCell>
                  </TableRow>
                ))}
                {maintenance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
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
  )
}
