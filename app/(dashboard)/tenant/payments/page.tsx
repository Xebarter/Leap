import { createClient } from "@/lib/supabase/server"
import { TenantHeader } from "@/components/tenantView/tenant-header"
import { PaymentHistory } from "@/components/tenantView/payment-history"
import { InvoicesList } from "@/components/tenantView/invoices-list"
import { PaymentSchedule } from "@/components/tenantView/payment-schedule"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function TenantPaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <TenantHeader user={{ email: "guest@example.com", user_metadata: { full_name: "Guest" } }} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <p className="text-muted-foreground">Please sign in to access your payments.</p>
            <a href="/auth/login" className="text-primary hover:underline font-medium mt-4 inline-block">
              Sign in to your account
            </a>
          </div>
        </main>
      </div>
    )
  }

  // Fetch payment transactions
  const { data: payments } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("tenant_id", user.id)
    .order("payment_date", { ascending: false })

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("tenant_id", user.id)
    .order("invoice_date", { ascending: false })

  // Fetch payment schedules
  const { data: schedules } = await supabase
    .from("payment_schedules")
    .select("*")
    .eq("tenant_id", user.id)
    .order("next_payment_date", { ascending: true })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TenantHeader user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground mt-2">View your invoices, transactions, and payment schedules</p>
          </header>

          <Tabs defaultValue="history" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="history" className="rounded-lg px-6">
                Transaction History
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg px-6">
                Invoices
              </TabsTrigger>
              <TabsTrigger value="schedules" className="rounded-lg px-6">
                Payment Schedules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-6">
              <PaymentHistory payments={payments || []} />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <InvoicesList invoices={invoices || []} />
            </TabsContent>

            <TabsContent value="schedules" className="space-y-6">
              <PaymentSchedule schedules={schedules || []} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
