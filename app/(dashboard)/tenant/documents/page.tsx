import { createClient } from "@/lib/supabase/server"
import { TenantMobileLayout } from "@/components/tenantView/tenant-mobile-layout"
import { TenantDocuments } from "@/components/tenantView/tenant-documents"
import { TenantReferences } from "@/components/tenantView/tenant-references"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, CheckCircle2, Clock, AlertCircle, Upload, Shield } from "lucide-react"

export default async function TenantDocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <TenantMobileLayout user={{ email: "guest@example.com", user_metadata: { full_name: "Guest" } }}>
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-muted-foreground">Please sign in to access your documents.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </div>
      </TenantMobileLayout>
    )
  }

  // Get tenant profile ID
  const { data: tenantProfile } = await supabase
    .from("tenant_profiles")
    .select("id, verification_status")
    .eq("user_id", user.id)
    .single()

  // Fetch documents
  const { data: documents } = await supabase
    .from("tenant_documents")
    .select("*")
    .eq("tenant_profile_id", tenantProfile?.id)
    .order("created_at", { ascending: false })

  // Fetch references
  const { data: references } = await supabase
    .from("tenant_references")
    .select("*")
    .eq("tenant_profile_id", tenantProfile?.id)
    .order("created_at", { ascending: false })

  // Calculate statistics
  const docStats = {
    total: documents?.length || 0,
    approved: documents?.filter(d => d.status === 'approved').length || 0,
    pending: documents?.filter(d => d.status === 'pending').length || 0,
    rejected: documents?.filter(d => d.status === 'rejected').length || 0,
  }

  const refStats = {
    total: references?.length || 0,
    verified: references?.filter(r => r.verification_status === 'verified').length || 0,
    pending: references?.filter(r => r.verification_status === 'pending').length || 0,
  }

  return (
    <TenantMobileLayout user={user}>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Documents & References</h1>
                <p className="text-muted-foreground mt-2">Manage your verification documents and references</p>
              </div>
              <Badge 
                variant={tenantProfile?.verification_status === "verified" ? "default" : "secondary"}
                className="self-start md:self-center"
              >
                {tenantProfile?.verification_status === "verified" ? (
                  <><Shield className="w-3 h-3 mr-1" /> Verified</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> {tenantProfile?.verification_status || "Unverified"}</>
                )}
              </Badge>
            </div>
          </header>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{docStats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{docStats.approved}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">References</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{refStats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{docStats.pending + refStats.pending}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="bg-gradient-to-r from-muted/80 to-muted/50 backdrop-blur-sm p-1.5 rounded-xl w-full flex justify-start shadow-sm border border-border/50">
              <TabsTrigger 
                value="documents" 
                className="rounded-lg px-4 md:px-8 py-2.5 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
                {docStats.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {docStats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="references" 
                className="rounded-lg px-4 md:px-8 py-2.5 flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                <span>References</span>
                {refStats.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {refStats.total}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              <TenantDocuments documents={documents || []} />
            </TabsContent>

            <TabsContent value="references" className="space-y-6">
              <TenantReferences references={references || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TenantMobileLayout>
  )
}
