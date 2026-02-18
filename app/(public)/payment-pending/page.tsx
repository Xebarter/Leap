"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Clock, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PaymentPendingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const transaction = searchParams.get('transaction')
  const [checking, setChecking] = useState(false)

  const checkPaymentStatus = async () => {
    if (!transaction) return
    
    setChecking(true)
    try {
      // You can implement an API endpoint to check payment status
      const response = await fetch(`/api/payments/verify?transactionId=${transaction}`)
      const data = await response.json()
      
      if (data.status === 'completed') {
        router.push(`/payment-success?transaction=${transaction}`)
      } else if (data.status === 'failed') {
        router.push(`/payment-failed?reason=${encodeURIComponent(data.reason || 'Payment failed')}`)
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Payment Pending</CardTitle>
            <CardDescription className="mt-2">
              Your payment is being processed
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

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your payment is being processed. This usually takes a few moments. 
              You can check the status or come back later.
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="space-y-3 text-sm">
            <h4 className="font-semibold">What's Happening?</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                • Your payment is being verified by the payment provider
              </li>
              <li className="flex items-start gap-2">
                • This can take up to a few minutes
              </li>
              <li className="flex items-start gap-2">
                • You will receive a confirmation email once processed
              </li>
              <li className="flex items-start gap-2">
                • You can safely close this page and check back later
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="w-full gap-2"
            >
              {checking ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  <span>Check Payment Status</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Need help? Contact support at support@yourapp.com
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
