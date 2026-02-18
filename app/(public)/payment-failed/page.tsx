"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { XCircle, Home, ArrowLeft, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reason = searchParams.get('reason')
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Payment Failed</CardTitle>
            <CardDescription className="mt-2">
              We couldn't process your payment
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {(reason || error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {reason || error === 'missing_tracking_id' 
                  ? 'Missing transaction tracking information' 
                  : error === 'callback_error'
                  ? 'Payment callback processing error'
                  : 'An error occurred during payment processing'}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-3 text-sm">
            <h4 className="font-semibold">Common Issues:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                • Insufficient funds in your account
              </li>
              <li className="flex items-start gap-2">
                • Incorrect card details or expired card
              </li>
              <li className="flex items-start gap-2">
                • Transaction declined by your bank
              </li>
              <li className="flex items-start gap-2">
                • Network connectivity issues
              </li>
            </ul>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={() => router.push('/properties')}
              className="w-full gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Try Again</span>
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
