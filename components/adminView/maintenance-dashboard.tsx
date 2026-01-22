"use client"

import { formatDateConsistent } from "@/lib/date-utils"
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
import { Search, AlertCircle, CheckCircle, Clock, User } from "lucide-react"

interface MaintenanceRequest {
  id: string
  request_number: string
  tenant_id: string
  title: string
  description: string
  severity: string
  status: string
  request_date: string
  due_date?: string
}

interface WorkOrder {
  id: string
  work_order_number: string
  title: string
  priority: string
  status: string
  assigned_to?: string
  due_date?: string
  estimated_cost_ugx?: number
  actual_cost_ugx?: number
}

interface MaintenanceStaff {
  id: string
  staff_name: string
  staff_type: string
  employment_status: string
  phone_number?: string
  email?: string
}

interface MaintenanceAsset {
  id: string
  asset_tag: string
  asset_name: string
  asset_type: string
  status: string
  last_maintenance_date?: string
}

interface MaintenanceDashboardProps {
  requests: MaintenanceRequest[]
  workOrders: WorkOrder[]
  staff: MaintenanceStaff[]
  assets: MaintenanceAsset[]
}

export function MaintenanceDashboard({
  requests = [],
  workOrders = [],
  staff = [],
  assets = []
}: MaintenanceDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("requests")

  // Calculate summary statistics
  const openRequests = requests.filter(r => r.status === 'open').length
  const inProgressRequests = requests.filter(r => r.status === 'in_progress').length
  const completedRequests = requests.filter(r => r.status === 'completed').length
  const emergencyRequests = requests.filter(r => r.severity === 'Emergency').length

  const inProgressOrders = workOrders.filter(w => w.status === 'in_progress').length
  const completedOrders = workOrders.filter(w => w.status === 'completed').length

  const activeStaff = staff.filter(s => s.employment_status === 'Active').length
  const activeAssets = assets.filter(a => a.status === 'active').length

  // Filter functions
  const filteredRequests = requests.filter(req =>
    req.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.work_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStaff = staff.filter(s =>
    s.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssets = assets.filter(a =>
    a.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      open: "bg-blue-100 text-blue-800",
      assigned: "bg-cyan-100 text-cyan-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      active: "bg-green-100 text-green-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      broken: "bg-red-100 text-red-800",
      retired: "bg-gray-100 text-gray-800",
    }
    return variants[status] || "bg-gray-100 text-gray-800"
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === 'Emergency') return <AlertCircle className="h-4 w-4 text-red-600" />
    if (severity === 'High') return <AlertCircle className="h-4 w-4 text-orange-600" />
    return <Clock className="h-4 w-4 text-blue-600" />
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{emergencyRequests}</div>
            <p className="text-xs text-muted-foreground">Urgent issues</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card className="bg-card border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>Manage requests, work orders, staff, and assets</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search maintenance..."
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requests">
                Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="workorders">
                Work Orders ({workOrders.length})
              </TabsTrigger>
              <TabsTrigger value="staff">
                Staff ({staff.length})
              </TabsTrigger>
              <TabsTrigger value="assets">
                Assets ({assets.length})
              </TabsTrigger>
            </TabsList>

            {/* Maintenance Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{request.request_number}</TableCell>
                          <TableCell>{request.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getSeverityIcon(request.severity)}
                              <span>{request.severity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateConsistent(request.request_date)}</TableCell>
                          <TableCell>{request.due_date ? formatDateConsistent(request.due_date) : "N/A"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No maintenance requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Work Orders Tab */}
            <TabsContent value="workorders" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Work Order #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkOrders.length > 0 ? (
                      filteredWorkOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{order.work_order_number}</TableCell>
                          <TableCell>{order.title}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(order.priority.toLowerCase())}>
                              {order.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.assigned_to ? "Assigned" : "Unassigned"}</TableCell>
                          <TableCell>{order.estimated_cost_ugx ? `UGX ${new Intl.NumberFormat('en-US').format(order.estimated_cost_ugx)}` : "N/A"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No work orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((member) => (
                        <TableRow key={member.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{member.staff_name}</TableCell>
                          <TableCell>{member.staff_type}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(member.employment_status.toLowerCase())}>
                              {member.employment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>{member.phone_number || "N/A"}</TableCell>
                          <TableCell>{member.email || "N/A"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets" className="space-y-4">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <TableRow key={asset.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{asset.asset_tag}</TableCell>
                          <TableCell>{asset.asset_name}</TableCell>
                          <TableCell>{asset.asset_type}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(asset.status)}>
                              {asset.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {asset.last_maintenance_date 
                              ? formatDateConsistent(asset.last_maintenance_date)
                              : "Never"
                            }
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No assets found
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
