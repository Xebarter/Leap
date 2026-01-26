import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TenantMobileLayout } from "@/components/tenantView/tenant-mobile-layout"

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <TenantMobileLayout user={user}>{children}</TenantMobileLayout>
}
