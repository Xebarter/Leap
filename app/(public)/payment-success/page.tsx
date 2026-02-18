"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const transaction = searchParams.get('transaction')
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/tenant/reservations')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Payment Successful! 🎉</CardTitle>
            <CardDescription className="mt-2">
              Your reservation payment has been processed successfully
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {transaction && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <Badge variant="outline" className="font-mono">
                  {transaction}
                </Badge>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3 text-sm">
            <h4 className="font-semibold flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              What's Next?
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Your reservation is now confirmed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Check your email for payment receipt</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Track your reservation in the tenant dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                <span>Our team will contact you within 24 hours</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={() => router.push('/tenant/reservations')}
              className="w-full gap-2"
            >
              <span>View My Reservations</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
