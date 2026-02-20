import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminMobileHeader } from "@/components/adminView/admin-mobile-header"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin && profile?.role !== "admin") {
    redirect("/")
  }

  return (
    <>
      <AdminMobileHeader />
      {children}
    </>
  )
}
