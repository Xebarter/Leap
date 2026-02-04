import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/adminView/admin-sidebar"
import { BuildingsManager } from "@/components/adminView/buildings-manager"
import { redirect } from "next/navigation"

export default async function AdminBuildingsPage() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // If no user, redirect to login
  if (!user) {
    redirect('/auth/login')
  }

  // Verify user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin || profile?.role === 'admin'

  if (!isAdmin) {
    redirect('/tenant')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Buildings Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your apartment buildings, unit types, and individual units
            </p>
          </div>

          <BuildingsManager userId={user.id} />
        </div>
      </main>
    </div>
  )
}
