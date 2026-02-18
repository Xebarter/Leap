"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  CreditCard,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  CheckCircle2,
  Smartphone,
  Building2,
  Calendar,
  DollarSign,
  Users
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatPrice } from "@/lib/utils"

interface PesapalPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  propertyCode: string
  propertyTitle: string
  propertyId: string
  monthlyAmount?: number
  depositMonths?: number
  onSuccess?: (transactionId: string) => void
}

export function PesapalPaymentDialog({
  open,
  onOpenChange,
  amount,
  propertyCode,
  propertyTitle,
  propertyId,
  monthlyAmount,
  depositMonths,
  onSuccess,
}: PesapalPaymentDialogProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !phoneNumber || !email) {
      toast({
        title: "Missing Information",
        description: "Please provide your name, phone number and email address.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Extract firstName and lastName from full name
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || email.split('@')[0]
      const lastName = nameParts.slice(1).join(' ') || 'User'

      const paymentPayload = {
        amount,
        email,
        phoneNumber,
        firstName,
        lastName,
        propertyCode,
        description: `Deposit payment for ${propertyTitle}`,
        propertyId,
      }

      console.log('Payment payload:', paymentPayload)

      const response = await fetch('/api/payments/pesapal/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      console.log('Payment initiated successfully:', data)

      // Redirect to Pesapal payment page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        throw new Error('No redirect URL received from payment gateway')
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    let cleaned = value.replace(/\D/g, '')
    
    // Limit to reasonable length
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12)
    }
    
    setPhoneNumber(cleaned)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold">Make Payment</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Secure your property with a deposit payment via Pesapal
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handlePayment} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Payment Summary Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Property</p>
                  <p className="font-semibold line-clamp-1">{propertyTitle}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  #{propertyCode}
                </Badge>
              </div>

              <Separator />

              {/* Amount Breakdown */}
              <div className="space-y-2">
                {monthlyAmount && depositMonths && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-medium">{formatPrice(monthlyAmount)} UGX</span>
                  </div>
                )}
                {depositMonths && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit Period</span>
                    <span className="font-medium">{depositMonths} {depositMonths === 1 ? 'month' : 'months'}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPrice(amount)}</p>
                    <p className="text-xs text-muted-foreground">UGX</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Alert */}
          {isProcessing && (
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-900">
                Redirecting to Pesapal... Please do not close this window.
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Enter your full name as it appears on your ID
              </p>
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="256700000000"
                value={phoneNumber}
                onChange={(e) => formatPhoneNumber(e.target.value)}
                className="h-12"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Enter your phone number for payment confirmation
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                You'll receive payment receipts at this email
              </p>
            </div>
          </div>

          {/* Payment Method Info */}
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold">Secure Payment via Pesapal</p>
                  <p className="text-xs text-muted-foreground">
                    You'll be redirected to Pesapal's secure payment page where you can pay using:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CreditCard className="w-3 h-3" />
                      Cards
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Smartphone className="w-3 h-3" />
                      Mobile Money
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !fullName || !phoneNumber || !email}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>PCI-compliant secure payment processing</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
