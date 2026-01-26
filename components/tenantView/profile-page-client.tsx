"use client"

import { useState } from "react"
import { ProfileAvatarUpload } from "./profile-avatar-upload"
import { TenantProfile } from "./tenant-profile"
import { TenantDocuments } from "./tenant-documents"
import { TenantReferences } from "./tenant-references"
import { ProfileEditForm } from "./forms/profile-edit-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, FileText, Users, Shield, Settings, CheckCircle2, AlertCircle } from "lucide-react"

interface ProfilePageClientProps {
  userProfile: any
  tenantProfile: any
  documents: any[]
  references: any[]
  displayName: string
}

export function ProfilePageClient({
  userProfile,
  tenantProfile,
  documents,
  references,
  displayName,
}: ProfilePageClientProps) {
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null)

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl)
  }

  return (
    <div className="space-y-6">
      {/* Avatar Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfileAvatarUpload
            avatarUrl={avatarUrl}
            fullName={displayName}
            onAvatarUpdate={handleAvatarUpdate}
          />
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-lg bg-card h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{userProfile?.email}</p>
                </div>
                <ProfileEditForm profile={tenantProfile} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={tenantProfile?.status === "active" ? "default" : "destructive"}
                  className="text-xs px-3 py-1"
                >
                  {tenantProfile?.status === "active" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" /> {tenantProfile?.status || "Inactive"}
                    </>
                  )}
                </Badge>
                <Badge
                  variant={tenantProfile?.verification_status === "verified" ? "default" : "secondary"}
                  className="text-xs px-3 py-1"
                >
                  {tenantProfile?.verification_status === "verified" ? (
                    <>
                      <Shield className="w-3 h-3 mr-1" /> Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" /> Unverified
                    </>
                  )}
                </Badge>
              </div>

              {userProfile?.bio && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
                </div>
              )}

              {userProfile?.phone_number && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-sm font-medium">{userProfile.phone_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-muted/80 backdrop-blur-sm p-1.5 rounded-xl w-full flex justify-start">
          <TabsTrigger
            value="personal"
            className="rounded-lg px-6 py-2.5 text-sm flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-lg px-6 py-2.5 text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Documents
            {documents && documents.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="references"
            className="rounded-lg px-6 py-2.5 text-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            References
            {references && references.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {references.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <TenantProfile profile={tenantProfile} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <TenantDocuments documents={documents || []} />
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          <TenantReferences references={references || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
