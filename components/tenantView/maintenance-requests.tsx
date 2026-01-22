"use client"

import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MaintenanceRequestForm } from "./forms/maintenance-request-form"
import { AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react"

export function MaintenanceRequests({ requests }: { requests: any[] }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Emergency":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "High":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case "Medium":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "assigned":
        return <Badge className="bg-purple-100 text-purple-800">Assigned</Badge>
      case "open":
        return <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Emergency":
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>
      case "High":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
    }
  }

  if (requests.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground mb-4">No maintenance requests yet</p>
          <MaintenanceRequestForm />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Maintenance Requests</h3>
        <MaintenanceRequestForm />
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="border-none shadow-none bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-1">{getSeverityIcon(request.severity)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {getSeverityBadge(request.severity)}
                  {request.location_in_property && (
                    <Badge variant="outline">{request.location_in_property}</Badge>
                  )}
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Requested: {formatDateConsistent(request.request_date)}</span>
                  {request.due_date && (
                    <span>Due: {formatDateConsistent(request.due_date)}</span>
                  )}
                </div>

                {request.rejection_reason && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    Reason: {request.rejection_reason}
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
