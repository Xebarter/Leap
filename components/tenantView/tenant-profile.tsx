"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Clock, FileText, MapPin, Phone, Calendar, Briefcase, DollarSign, Mail, User, Edit } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { formatDateConsistent } from "@/lib/date-utils"

export function TenantProfile({ profile }: { profile: any }) {
  if (!profile) {
    return (
      <Card className="border-none shadow-lg bg-gradient-to-br from-muted/30 to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        <CardContent className="pt-12 pb-12 text-center relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Your profile is incomplete. Add your personal information to unlock all features and improve your rental experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="gap-2">
              <User className="w-4 h-4" />
              Complete Profile
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Learn More
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-3 bg-background/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Better Matches</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Faster Approval</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">More Trust</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unverified</Badge>
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Personal Information */}
      <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Your personal details and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Phone Number</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.phone_number || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Date of Birth</p>
              </div>
              <p className="font-medium text-sm md:text-base">
                {profile.date_of_birth ? formatDateConsistent(profile.date_of_birth) : "Not provided"}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">ID Type</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.national_id_type || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">ID Number</p>
              </div>
              <p className="font-medium text-sm md:text-base font-mono">{profile.national_id ? `***${profile.national_id.slice(-4)}` : "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Address */}
      <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Home Address
          </CardTitle>
          <CardDescription>Your residential address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Street Address</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.home_address || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">City</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.home_city || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">District</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.home_district || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Postal Code</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.home_postal_code || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Employment Information
          </CardTitle>
          <CardDescription>Your employment and financial details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Employment Status</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profile.employment_status || "Not provided"}
              </Badge>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Employment Type</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profile.employment_type || "Not provided"}
              </Badge>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Employer</p>
              </div>
              <p className="font-medium text-sm md:text-base">{profile.employer_name || "Not provided"}</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">Monthly Income</p>
              </div>
              <p className="font-medium text-sm md:text-base text-green-600 dark:text-green-400">
                {profile.monthly_income_ugx ? formatPrice(profile.monthly_income_ugx) : "Not provided"}
              </p>
            </div>
            {profile.employment_start_date && (
              <div className="sm:col-span-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs md:text-sm text-muted-foreground">Employment Start Date</p>
                </div>
                <p className="font-medium text-sm md:text-base">{formatDateConsistent(profile.employment_start_date)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Verification Status
          </CardTitle>
          <CardDescription>Your identity verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-background/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getVerificationIcon(profile.verification_status)}
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Current Status</p>
                <p className="font-semibold text-sm md:text-base">{profile.verification_status || "Unverified"}</p>
              </div>
            </div>
            {getVerificationBadge(profile.verification_status)}
          </div>
          {profile.verification_date && (
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Verified On</p>
              </div>
              <p className="text-sm font-medium">
                {formatDateConsistent(profile.verification_date)}
              </p>
            </div>
          )}
          {profile.verification_status !== "verified" && (
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs md:text-sm text-orange-900 dark:text-orange-200">
                Complete your profile and upload required documents to get verified
              </p>
            </div>
          )}
          <Button variant="outline" className="w-full mt-2" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Manage Documents
          </Button>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className={`border-none shadow-sm hover:shadow-md transition-shadow ${
        profile.status === "active" 
          ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900" 
          : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            {profile.status === "active" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            Account Status
          </CardTitle>
          <CardDescription>Your tenant account standing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Current Status</p>
              <p className="font-semibold text-sm md:text-base capitalize">{profile.status || "Unknown"}</p>
            </div>
            <Badge 
              variant={profile.status === "active" ? "default" : "destructive"}
              className="text-xs"
            >
              {profile.status || "Unknown"}
            </Badge>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs md:text-sm text-muted-foreground">
              {profile.status === "active" 
                ? "✓ Your account is active and in good standing. You can book properties and manage your rentals." 
                : "⚠ Your account status requires attention. Please contact support if you have any questions."}
            </p>
          </div>
          {profile.preferred_communication && (
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Preferred Communication</p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize">
                {profile.preferred_communication}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
