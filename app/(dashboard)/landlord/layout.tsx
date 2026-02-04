import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LandlordHeader from "@/components/landlordView/landlord-header"
import { LandlordMobileLayout } from "@/components/landlordView/landlord-mobile-layout"

export default async function LandlordLayout({
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

  // Check if user is a landlord
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, user_type, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "landlord" && profile?.user_type !== "landlord") {
    redirect("/tenant") // Redirect non-landlords to tenant dashboard
  }

  // Fetch landlord profile
  const { data: landlordProfile } = await supabase
    .from("landlord_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Prefer the canonical name from public.profiles, then auth metadata, then email prefix
  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Landlord"

  return (
    <LandlordMobileLayout user={user} landlordProfile={landlordProfile} displayName={displayName}>
      <LandlordHeader user={user} landlordProfile={landlordProfile} displayName={displayName} />
      <main className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </LandlordMobileLayout>
  )
}
