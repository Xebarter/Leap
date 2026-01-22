"use client"

import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ComplaintForm } from "./forms/complaint-form"
import { AlertCircle, MessageSquare, CheckCircle2 } from "lucide-react"

export function TenantComplaints({ complaints }: { complaints: any[] }) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Emergency":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "High":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Emergency":
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>
      case "High":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "Normal":
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "open":
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      case "pending_review":
        return <Badge className="bg-purple-100 text-purple-800">Pending Review</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (complaints.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground mb-4">No complaints filed yet</p>
          <ComplaintForm />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Complaints</h3>
        <ComplaintForm />
      </div>

      <div className="space-y-3">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="border-none shadow-none bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-1">{getPriorityIcon(complaint.priority)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{complaint.title}</p>
                      <p className="text-sm text-muted-foreground">{complaint.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(complaint.status)}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {getPriorityBadge(complaint.priority)}
                  <Badge variant="outline">{complaint.complaint_type}</Badge>
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Filed: {formatDateConsistent(complaint.created_at)}</span>
                  {complaint.expected_resolution_date && (
                    <span>Expected Resolution: {formatDateConsistent(complaint.expected_resolution_date)}</span>
                  )}
                </div>

                {complaint.resolution_notes && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded border border-muted-foreground/20">
                    Resolution: {complaint.resolution_notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
