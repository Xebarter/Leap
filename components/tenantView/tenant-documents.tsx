"use client"

import { useState } from "react"
import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DocumentUploadForm } from "./forms/document-upload-form"
import { FileText, Download, Trash2, CheckCircle2, Clock, AlertCircle, Filter, Search, Upload, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"

export function TenantDocuments({ documents }: { documents: any[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "expired":
        return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  // Filter and search logic
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Group documents by category
  const documentCategories = {
    identity: ["National ID", "Passport", "Driving License"],
    employment: ["Employment Letter", "Pay Slip", "Bank Statement"],
    references: ["Tenant Reference", "Employer Reference"],
    other: ["Medical Report", "Police Clearance", "Other"]
  }

  const getCategoryName = (type: string) => {
    for (const [category, types] of Object.entries(documentCategories)) {
      if (types.includes(type)) {
        return category.charAt(0).toUpperCase() + category.slice(1)
      }
    }
    return "Other"
  }

  if (documents.length === 0) {
    return (
      <Card className="border-none shadow-lg bg-gradient-to-br from-muted/30 to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <CardContent className="pt-12 pb-12 text-center relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-500/5">
            <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Upload Your Documents</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start by uploading your verification documents. Required documents include ID, proof of employment, and references.
          </p>
          <DocumentUploadForm />
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-background/50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm mb-1">Identity Documents</p>
              <p className="text-xs text-muted-foreground">National ID, Passport</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-sm mb-1">Employment Proof</p>
              <p className="text-xs text-muted-foreground">Letter, Pay Slips</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-sm mb-1">References</p>
              <p className="text-xs text-muted-foreground">Previous Landlords</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-semibold">Uploaded Documents</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {filteredDocuments.length} of {documents.length} document(s)
          </p>
        </div>
        <DocumentUploadForm />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filterStatus === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("approved")}
            className="text-xs"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("pending")}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card className="border-none shadow-sm bg-muted/20">
          <CardContent className="pt-8 pb-8 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No documents match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow group">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="pt-1 flex-shrink-0">{getStatusIcon(doc.status)}</div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                        {doc.document_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs md:text-sm text-muted-foreground">{doc.document_type}</p>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(doc.document_type)}
                        </Badge>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  {/* Approval Notes */}
                  {doc.approval_notes && (
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg text-xs md:text-sm text-muted-foreground italic border-l-2 border-primary/30">
                      <p className="font-medium text-foreground mb-1">Admin Notes:</p>
                      {doc.approval_notes}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {doc.created_at && (
                      <div className="flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Uploaded {formatDateConsistent(doc.created_at)}</span>
                      </div>
                    )}
                    {doc.expiry_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires {formatDateConsistent(doc.expiry_date)}</span>
                      </div>
                    )}
                    {doc.file_size && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-blue-500 hover:text-white transition-colors">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete document"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
