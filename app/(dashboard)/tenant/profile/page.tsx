import { createClient } from "@/lib/supabase/server"
import { TenantMobileLayout } from "@/components/tenantView/tenant-mobile-layout"
import { TenantProfile } from "@/components/tenantView/tenant-profile"
import { TenantDocuments } from "@/components/tenantView/tenant-documents"
import { TenantReferences } from "@/components/tenantView/tenant-references"
import { ProfileEditForm } from "@/components/tenantView/forms/profile-edit-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, FileText, Users, Bell, Shield, Settings, Mail, CheckCircle2, AlertCircle, Clock, Calendar, Wrench } from "lucide-react"

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any, documents: any[], references: any[]): number {
  if (!profile) return 0
  
  let completed = 0
  let total = 0
  
  // Basic info (30%)
  const basicFields = ['phone_number', 'date_of_birth', 'national_id', 'national_id_type']
  basicFields.forEach(field => {
    total += 7.5
    if (profile[field]) completed += 7.5
  })
  
  // Address info (20%)
  const addressFields = ['home_address', 'home_city', 'home_district']
  addressFields.forEach(field => {
    total += 6.67
    if (profile[field]) completed += 6.67
  })
  
  // Employment info (20%)
  const employmentFields = ['employment_status', 'employer_name', 'monthly_income_ugx']
  employmentFields.forEach(field => {
    total += 6.67
    if (profile[field]) completed += 6.67
  })
  
  // Documents (20%)
  total += 20
  if (documents && documents.length >= 2) completed += 20
  else if (documents && documents.length === 1) completed += 10
  
  // References (10%)
  total += 10
  if (references && references.length >= 2) completed += 10
  else if (references && references.length === 1) completed += 5
  
  return Math.round((completed / total) * 100)
}

// Helper function to get profile strength
function getProfileStrength(percentage: number): { label: string; color: string; description: string } {
  if (percentage >= 90) {
    return { 
      label: "Excellent", 
      color: "from-green-500 to-emerald-500", 
      description: "Your profile stands out! Landlords will be impressed." 
    }
  } else if (percentage >= 70) {
    return { 
      label: "Strong", 
      color: "from-blue-500 to-cyan-500", 
      description: "Great profile! Just a few more details to go." 
    }
  } else if (percentage >= 50) {
    return { 
      label: "Good", 
      color: "from-yellow-500 to-orange-500", 
      description: "You're halfway there! Keep adding information." 
    }
  } else if (percentage >= 30) {
    return { 
      label: "Fair", 
      color: "from-orange-500 to-red-500", 
      description: "Add more details to improve your chances." 
    }
  } else {
    return { 
      label: "Weak", 
      color: "from-red-500 to-rose-500", 
      description: "Complete your profile to apply for properties." 
    }
  }
}

export default async function TenantProfilePage() {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <TenantMobileLayout user={{ email: "guest@example.com", user_metadata: { full_name: "Guest" } }}>
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-muted-foreground">Please sign in to access your profile.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </div>
      </TenantMobileLayout>
    )
  }

  // Fetch tenant profile first to get the correct ID for documents and references
  const { data: tenantProfile } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Fetch all profile-related data in parallel
  const [
    { data: userProfile },
    { data: documents },
    { data: references },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    tenantProfile 
      ? supabase.from("tenant_documents").select("*").eq("tenant_profile_id", tenantProfile.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    tenantProfile
      ? supabase.from("tenant_references").select("*").eq("tenant_profile_id", tenantProfile.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ])

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"

  return (
    <TenantMobileLayout user={user}>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your personal information and documents</p>
              </div>
              <ProfileEditForm profile={tenantProfile} />
            </div>
          </div>

          {/* Profile Overview Card - Enhanced */}
          <Card className="mb-6 md:mb-8 border-none shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6 md:p-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar with online indicator */}
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/10 shadow-lg">
                    <User className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                  </div>
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-background shadow-sm" title="Online" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant={tenantProfile?.status === "active" ? "default" : "destructive"} 
                      className="text-xs px-3 py-1"
                    >
                      {tenantProfile?.status === "active" ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" /> {tenantProfile?.status || "Inactive"}</>
                      )}
                    </Badge>
                    <Badge 
                      variant={tenantProfile?.verification_status === "verified" ? "default" : "secondary"}
                      className="text-xs px-3 py-1"
                    >
                      {tenantProfile?.verification_status === "verified" ? (
                        <><Shield className="w-3 h-3 mr-1" /> Verified</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Unverified</>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-3 py-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Badge>
                  </div>
                  
                  {/* Profile Completion Progress */}
                  {tenantProfile && (
                    <div className="mt-4 p-3 bg-background/50 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Profile Strength:</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-gradient-to-r ${getProfileStrength(calculateProfileCompletion(tenantProfile, documents, references)).color} text-white border-0`}
                          >
                            {getProfileStrength(calculateProfileCompletion(tenantProfile, documents, references)).label}
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {calculateProfileCompletion(tenantProfile, documents, references)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full bg-gradient-to-r ${getProfileStrength(calculateProfileCompletion(tenantProfile, documents, references)).color} transition-all duration-500 rounded-full`}
                          style={{ width: `${calculateProfileCompletion(tenantProfile, documents, references)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getProfileStrength(calculateProfileCompletion(tenantProfile, documents, references)).description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <ProfileEditForm profile={tenantProfile} />
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Settings className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Settings</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section - Enhanced */}
          <Tabs defaultValue="personal" className="space-y-6">
            <div className="relative">
              <TabsList className="bg-gradient-to-r from-muted/80 to-muted/50 backdrop-blur-sm p-1.5 rounded-xl overflow-x-auto w-full flex justify-start shadow-sm border border-border/50">
                <TabsTrigger 
                  value="personal" 
                  className="rounded-lg px-3 md:px-6 py-2.5 text-xs md:text-base flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Personal Info</span>
                  <span className="sm:hidden">Info</span>
                  {tenantProfile && calculateProfileCompletion(tenantProfile, documents, references) < 100 && (
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="rounded-lg px-3 md:px-6 py-2.5 text-xs md:text-base flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                  <span className="sm:hidden">Docs</span>
                  {documents && documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {documents.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="references" 
                  className="rounded-lg px-3 md:px-6 py-2.5 text-xs md:text-base flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">References</span>
                  <span className="sm:hidden">Refs</span>
                  {references && references.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {references.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-lg px-3 md:px-6 py-2.5 text-xs md:text-base flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Security</span>
                  <span className="sm:hidden">Sec</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="rounded-lg px-3 md:px-6 py-2.5 text-xs md:text-base flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Preferences</span>
                  <span className="sm:hidden">Prefs</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personal" className="space-y-6">
              {/* Profile Completion Guide */}
              {tenantProfile && calculateProfileCompletion(tenantProfile, documents, references) < 100 && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-l-4 border-orange-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Fill in the missing information to improve your profile and increase approval chances.
                        </p>
                        <div className="space-y-2">
                          {!tenantProfile.phone_number && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Add your phone number</span>
                            </div>
                          )}
                          {!tenantProfile.national_id && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Add your national ID</span>
                            </div>
                          )}
                          {!tenantProfile.home_address && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Add your home address</span>
                            </div>
                          )}
                          {!tenantProfile.employer_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Add employment information</span>
                            </div>
                          )}
                          {(!documents || documents.length < 2) && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Upload at least 2 verification documents</span>
                            </div>
                          )}
                          {(!references || references.length < 2) && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>Add at least 2 references</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Message for Complete Profile with Achievements */}
              {tenantProfile && calculateProfileCompletion(tenantProfile, documents, references) === 100 && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-l-4 border-green-500">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Profile Complete! 🎉</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Your profile is 100% complete. You're all set to apply for properties with confidence!
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 text-xs">
                            🏆 Profile Master
                          </Badge>
                          {tenantProfile.verification_status === "verified" && (
                            <Badge variant="outline" className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0 text-xs">
                              ✓ Verified User
                            </Badge>
                          )}
                          {documents && documents.length >= 3 && (
                            <Badge variant="outline" className="bg-gradient-to-r from-purple-400 to-purple-600 text-white border-0 text-xs">
                              📄 Document Pro
                            </Badge>
                          )}
                          {references && references.length >= 2 && (
                            <Badge variant="outline" className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0 text-xs">
                              👥 Well Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification Progress Guide */}
              {tenantProfile && tenantProfile.verification_status !== "verified" && (
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Verification Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${tenantProfile.phone_number && tenantProfile.national_id ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${tenantProfile.phone_number && tenantProfile.national_id ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {tenantProfile.phone_number && tenantProfile.national_id ? '✓' : '1'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Complete Personal Info</p>
                          <p className="text-xs text-muted-foreground">Add phone number and national ID</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${documents && documents.length >= 2 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${documents && documents.length >= 2 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {documents && documents.length >= 2 ? '✓' : '2'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Upload Documents</p>
                          <p className="text-xs text-muted-foreground">At least 2 verification documents</p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${references && references.length >= 2 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${references && references.length >= 2 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {references && references.length >= 2 ? '✓' : '3'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Add References</p>
                          <p className="text-xs text-muted-foreground">At least 2 professional references</p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${tenantProfile.verification_status === "pending" || tenantProfile.verification_status === "verified" ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted/30'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${tenantProfile.verification_status === "verified" ? 'bg-green-500 text-white' : tenantProfile.verification_status === "pending" ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {tenantProfile.verification_status === "verified" ? '✓' : '4'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Admin Verification</p>
                          <p className="text-xs text-muted-foreground">
                            {tenantProfile.verification_status === "pending" ? "Under review..." : "Awaiting admin review"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <TenantProfile profile={tenantProfile} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              {/* Documents Quick Tip */}
              {(!documents || documents.length === 0) && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">📄 Upload Verification Documents</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Required documents help landlords verify your identity and employment. This increases your approval rate significantly.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="p-2 bg-background/50 rounded">
                            <p className="font-medium">✓ National ID/Passport</p>
                          </div>
                          <div className="p-2 bg-background/50 rounded">
                            <p className="font-medium">✓ Employment Letter</p>
                          </div>
                          <div className="p-2 bg-background/50 rounded">
                            <p className="font-medium">✓ Pay Slip</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {documents && documents.length > 0 && documents.length < 2 && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <p className="text-sm">
                        <strong>Almost there!</strong> Upload one more document to reach the minimum requirement.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <TenantDocuments documents={documents || []} />
            </TabsContent>

            <TabsContent value="references" className="space-y-6">
              {/* References Quick Tip */}
              {(!references || references.length === 0) && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">👥 Add Your References</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          References from employers or previous landlords add credibility to your application. Aim for at least 2 references.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-background/50 rounded">
                            <p className="font-medium">✓ Previous Landlord</p>
                            <p className="text-muted-foreground">Most valuable</p>
                          </div>
                          <div className="p-2 bg-background/50 rounded">
                            <p className="font-medium">✓ Current Employer</p>
                            <p className="text-muted-foreground">Verifies income</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {references && references.length > 0 && references.length < 2 && (
                <Card className="border-none shadow-sm bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <p className="text-sm">
                        <strong>Add one more!</strong> Having 2+ references significantly improves your application strength.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <TenantReferences references={references || []} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Manage your account security and access</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password */}
                  <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold">Password</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">Last changed: Never</p>
                        <a href="/auth/reset-password">
                          <Button variant="outline" size="sm" className="text-xs">
                            Change Password
                          </Button>
                        </a>
                      </div>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                  </div>

                  {/* Email Verification */}
                  <div className={`p-4 rounded-lg border border-border/50 hover:shadow-md transition-shadow ${
                    user.email_confirmed_at 
                      ? 'bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50' 
                      : 'bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.email_confirmed_at ? 'bg-green-500/20' : 'bg-orange-500/20'
                          }`}>
                            {user.email_confirmed_at ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            )}
                          </div>
                          <h3 className="font-semibold">Email Verification</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {user.email_confirmed_at 
                            ? "Your email is verified and secure" 
                            : "Verify your email to secure your account"}
                        </p>
                        {!user.email_confirmed_at && (
                          <Button variant="outline" size="sm" className="text-xs">
                            Resend Verification Email
                          </Button>
                        )}
                      </div>
                      <Badge 
                        variant={user.email_confirmed_at ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.email_confirmed_at ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow opacity-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <h3 className="font-semibold">Two-Factor Authentication</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Add an extra layer of security to your account</p>
                        <Badge variant="outline" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    </div>
                  </div>

                  {/* Account Activity */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold">Recent Activity</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <span className="text-muted-foreground">Last login</span>
                        <span className="font-medium">Just now</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <span className="text-muted-foreground">IP Address</span>
                        <span className="font-medium">***.***.***.**</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Customize how and when you receive notifications</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Communication Method */}
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">Communication Method</h3>
                      </div>
                      <Badge variant="default" className="text-xs capitalize">
                        {tenantProfile?.preferred_communication || "Email"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      We'll use this method for important updates and notifications
                    </p>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Settings className="w-3 h-3 mr-2" />
                      Change Method
                    </Button>
                  </div>

                  {/* Notification Categories */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Notification Categories</h3>
                    
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Payment Reminders</p>
                            <p className="text-xs text-muted-foreground">Get notified about upcoming payments</p>
                          </div>
                        </div>
                        <Badge variant="default" className="text-xs">On</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Maintenance Updates</p>
                            <p className="text-xs text-muted-foreground">Status updates on your requests</p>
                          </div>
                        </div>
                        <Badge variant="default" className="text-xs">On</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Property Notices</p>
                            <p className="text-xs text-muted-foreground">Important notices from landlords</p>
                          </div>
                        </div>
                        <Badge variant="default" className="text-xs">On</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:shadow-md transition-shadow opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Marketing Updates</p>
                            <p className="text-xs text-muted-foreground">New properties and promotions</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Off</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Advanced Settings Coming Soon
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          More granular control over notification timing and channels will be available in the next update.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TenantMobileLayout>
  )
}
