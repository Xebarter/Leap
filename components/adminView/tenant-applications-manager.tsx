"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { 
  FileText, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home,
  Calendar,
  DollarSign,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Filter,
  ExternalLink
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TenantApplicationsManagerProps {
  initialApplications: any[]
}

export function TenantApplicationsManager({ initialApplications }: TenantApplicationsManagerProps) {
  const [applications, setApplications] = useState(initialApplications)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "under_review" | "approved" | "rejected">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  // Calculate statistics
  const stats = useMemo(() => {
    const total = applications.length
    const pending = applications.filter(a => a.status === 'pending').length
    const underReview = applications.filter(a => a.status === 'under_review').length
    const approved = applications.filter(a => a.status === 'approved').length
    const rejected = applications.filter(a => a.status === 'rejected').length

    return { total, pending, underReview, approved, rejected }
  }, [applications])

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = 
        app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.properties?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.application_number?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || app.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [applications, searchQuery, statusFilter])

  // Refresh applications
  const refreshApplications = async () => {
    setIsRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tenant_applications")
      .select(`
        *,
        properties (id, title, location)
      `)
      .order("submitted_at", { ascending: false })

    if (!error && data) {
      setApplications(data)
    }
    setIsRefreshing(false)
  }

  // Update application status
  const updateApplicationStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const updates: any = { status }
    
    if (status === 'approved' || status === 'rejected') {
      updates.reviewed_by = user?.id
      updates.reviewed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("tenant_applications")
      .update(updates)
      .eq("id", id)

    if (error) {
      toast.error("Failed to update application", { description: error.message })
    } else {
      toast.success(`Application ${status}!`)
      refreshApplications()
    }
  }

  // Download document
  const downloadDocument = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(link.href)
    } catch (error) {
      toast.error("Failed to download document")
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      under_review: { variant: "default" as const, icon: Eye, label: "Under Review" },
      approved: { variant: "default" as const, icon: CheckCircle2, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
    }
    
    const { variant, icon: Icon, label } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // View application details
  const viewDetails = (application: any) => {
    setSelectedApplication(application)
    setDetailsOpen(true)
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Tenant Applications</CardTitle>
              <CardDescription>
                Review and manage tenant rental applications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshApplications}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or application number..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Status:</span>
            </div>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={statusFilter === "under_review" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("under_review")}
            >
              Under Review ({stats.underReview})
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
            >
              Approved ({stats.approved})
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected ({stats.rejected})
            </Button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filteredApplications.length}</strong> of{" "}
            <strong className="text-foreground">{stats.total}</strong> applications
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search query."
                : "Tenant applications will appear here when submitted."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Application #</TableHead>
                  <TableHead className="font-semibold">Applicant</TableHead>
                  <TableHead className="font-semibold">Property</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Submitted</TableHead>
                  <TableHead className="font-semibold">Documents</TableHead>
                  <TableHead className="w-[80px] text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {application.application_number}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {application.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {application.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {application.properties?.title || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{application.properties?.location || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(application.submitted_at), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        {application.national_id_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadDocument(application.national_id_url, application.national_id_filename)}
                            title="Download National ID"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {application.proof_of_income_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadDocument(application.proof_of_income_url, application.proof_of_income_filename)}
                            title="Download Proof of Income"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => viewDetails(application)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {application.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => updateApplicationStatus(application.id, "under_review")}
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-500" />
                              Mark Under Review
                            </DropdownMenuItem>
                          )}
                          {(application.status === 'pending' || application.status === 'under_review') && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => updateApplicationStatus(application.id, "approved")}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                Approve Application
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => updateApplicationStatus(application.id, "rejected")}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Application
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Details Dialog - Coming next */}
      {selectedApplication && (
        <ApplicationDetailsDialog
          application={selectedApplication}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onDownload={downloadDocument}
          getStatusBadge={getStatusBadge}
        />
      )}
    </>
  )
}

// Application Details Dialog Component
function ApplicationDetailsDialog({ application, open, onOpenChange, onDownload, getStatusBadge }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Application Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this tenant application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Application Number</Label>
              <Badge variant="outline" className="font-mono mt-1">
                {application.application_number}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(application.status)}</div>
            </div>
          </div>

          <Separator />

          {/* Applicant Info */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Applicant Information</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{application.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{application.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{application.phone_number}</span>
              </div>
              {application.current_address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{application.current_address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Property Info */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Property Details</Label>
            <div className="space-y-1">
              <div className="font-medium">{application.properties?.title}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {application.properties?.location}
              </div>
            </div>
          </div>

          <Separator />

          {/* Employment Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Employment Status</Label>
              <div className="mt-1 text-sm capitalize">{application.employment_status?.replace('_', ' ') || 'N/A'}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Monthly Income</Label>
              <div className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                {application.monthly_income 
                  ? `UGX ${(application.monthly_income / 100).toLocaleString()}`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Move-in Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Preferred Move-in Date</Label>
              <div className="mt-1 text-sm flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {application.preferred_move_in_date 
                  ? format(new Date(application.preferred_move_in_date), "PPP")
                  : 'N/A'}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Number of Occupants</Label>
              <div className="mt-1 text-sm">{application.number_of_occupants || 1}</div>
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Uploaded Documents</Label>
            <div className="space-y-2">
              {application.national_id_url && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">National ID / Passport</div>
                      <div className="text-xs text-muted-foreground">{application.national_id_filename}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(application.national_id_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(application.national_id_url, application.national_id_filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {application.proof_of_income_url && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Proof of Income</div>
                      <div className="text-xs text-muted-foreground">{application.proof_of_income_filename}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(application.proof_of_income_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(application.proof_of_income_url, application.proof_of_income_filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {application.applicant_notes && (
            <>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Applicant Notes</Label>
                <div className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded p-3">
                  {application.applicant_notes}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Submission Date */}
          <div>
            <Label className="text-xs text-muted-foreground">Submitted On</Label>
            <div className="mt-1 text-sm">
              {format(new Date(application.submitted_at), "PPP")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
