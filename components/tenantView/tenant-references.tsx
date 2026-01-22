"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReferenceForm } from "./forms/reference-form"
import { Phone, Mail, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react"

export function TenantReferences({ references }: { references: any[] }) {
  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Unverified</Badge>
    }
  }

  if (references.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="pt-8 pb-8 text-center">
          <Users className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm md:text-base text-muted-foreground mb-2">No references added yet</p>
          <p className="text-xs md:text-sm text-muted-foreground mb-6">Add professional and personal references to strengthen your profile</p>
          <ReferenceForm />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg md:text-xl font-semibold">Your References</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">{references.length} reference(s) added</p>
        </div>
        <ReferenceForm />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {references.map((ref) => (
          <Card key={ref.id} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base truncate">{ref.reference_name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{ref.reference_title}</p>
                    {ref.reference_company && (
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{ref.reference_company}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {getVerificationIcon(ref.verification_status)}
                    {getVerificationBadge(ref.verification_status)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs md:text-sm">
                  {ref.reference_email && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{ref.reference_email}</span>
                    </div>
                  )}
                  {ref.reference_phone && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded text-muted-foreground">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{ref.reference_phone}</span>
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="text-xs">{ref.reference_type}</Badge>

                {ref.verification_notes && (
                  <div className="p-2 bg-muted/30 rounded text-xs md:text-sm text-muted-foreground italic border-l-2 border-primary/30">
                    {ref.verification_notes}
                  </div>
                )}
                
                {ref.verification_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified on {new Date(ref.verification_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
