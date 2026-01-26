import { createClient } from "@/lib/supabase/server"
import { PaymentHistory } from "@/components/tenantView/payment-history"
import { InvoicesList } from "@/components/tenantView/invoices-list"
import { PaymentSchedule } from "@/components/tenantView/payment-schedule"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"

export default async function TenantPaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground mt-2">View your invoices, transactions, and payment schedules</p>
      </header>

      <Tabs defaultValue="history" className="space-y-6 md:space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="history" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            <span className="hidden sm:inline">Transaction History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="schedules" className="rounded-lg px-3 sm:px-6 text-xs sm:text-sm">
            <span className="hidden sm:inline">Payment Schedules</span>
            <span className="sm:hidden">Schedules</span>
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
  )
}
