"use client"

import { formatDateConsistent } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Bell, CheckCircle2 } from "lucide-react"

export function TenantNotices({ notices }: { notices: any[] }) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "High":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-blue-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
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
      case "acknowledged":
        return <Badge className="bg-green-100 text-green-800">Acknowledged</Badge>
      case "read":
        return <Badge className="bg-blue-100 text-blue-800">Read</Badge>
      case "sent":
        return <Badge className="bg-yellow-100 text-yellow-800">New</Badge>
      case "expired":
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge variant="secondary">Draft</Badge>
    }
  }

  if (notices.length === 0) {
    return (
      <Card className="border-none shadow-none bg-muted/20">
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">No notices at this time</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notices</h3>

      <div className="space-y-3">
        {notices.map((notice) => (
          <Card
            key={notice.id}
            className={`border-none shadow-none ${notice.status === "sent" ? "bg-yellow-50" : "bg-muted/50"}`}
          >
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="pt-1">{getPriorityIcon(notice.priority)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{notice.title}</p>
                      <p className="text-sm text-muted-foreground">{notice.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(notice.status)}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {getPriorityBadge(notice.priority)}
                  <Badge variant="outline">{notice.notice_type}</Badge>
                </div>

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Posted: {formatDateConsistent(notice.created_at)}</span>
                  {notice.effective_date && (
                    <span>Effective: {formatDateConsistent(notice.effective_date)}</span>
                  )}
                </div>

                {notice.requires_acknowledgment && notice.status === "sent" && (
                  <Button variant="outline" size="sm">
                    Acknowledge Notice
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
