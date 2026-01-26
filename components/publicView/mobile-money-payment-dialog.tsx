"use client"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Phone
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface MobileMoneyPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  propertyCode: string
  propertyTitle: string
  reservationId?: string
  bookingId?: string
  onSuccess?: (transactionId: string) => void
}

export function MobileMoneyPaymentDialog({
  open,
  onOpenChange,
  amount,
  propertyCode,
  propertyTitle,
  reservationId,
  bookingId,
  onSuccess,
}: MobileMoneyPaymentDialogProps) {
  const [provider, setProvider] = useState<'airtel' | 'mtn' | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [providerTransactionId, setProviderTransactionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null)
  const { toast } = useToast()

  const handleProviderSelect = (selectedProvider: 'airtel' | 'mtn') => {
    setProvider(selectedProvider)
    setPaymentStatus(null)
    setPaymentInitiated(false)
  }

  const formatPhoneNumberDisplay = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present
    if (!cleaned.startsWith('256')) {
      if (cleaned.startsWith('0')) {
        cleaned = '256' + cleaned.substring(1)
      } else {
        cleaned = '256' + cleaned
      }
    }
    
    return cleaned
  }

  const handleInitiatePayment = async () => {
    if (!provider || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please select a provider and enter your phone number",
        variant: "destructive",
      })
      return
    }

    // Validate phone number format
    const formattedPhone = formatPhoneNumberDisplay(phoneNumber)
    if (formattedPhone.length !== 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Ugandan phone number",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          phoneNumber: formattedPhone,
          propertyCode,
          provider,
          description: `Payment for ${propertyTitle}`,
          reservationId,
          bookingId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTransactionId(data.transactionId)
        setProviderTransactionId(data.providerTransactionId)
        setPaymentInitiated(true)
        setPaymentStatus('pending')
        
        toast({
          title: "Payment Initiated",
          description: data.message || "Please check your phone to complete the payment",
        })

        // Start polling for payment status
        startPaymentVerification(data.transactionId, data.providerTransactionId)
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Failed to initiate payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast({
        title: "Error",
        description: "An error occurred while initiating payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startPaymentVerification = async (txnId: string, providerTxnId: string) => {
    setIsVerifying(true)
    
    // Poll every 5 seconds for up to 5 minutes
    const maxAttempts = 60
    let attempts = 0

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: txnId,
            providerTransactionId: providerTxnId,
            provider,
          }),
        })

        const data = await response.json()

        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setPaymentStatus('completed')
          setIsVerifying(false)
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your payment has been confirmed",
          })

          // Call success callback
          if (onSuccess) {
            onSuccess(txnId)
          }

          // Close dialog after 3 seconds
          setTimeout(() => {
            onOpenChange(false)
            resetDialog()
          }, 3000)
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setPaymentStatus('failed')
          setIsVerifying(false)
          
          toast({
            title: "Payment Failed",
            description: data.failureReason || "The payment was not completed",
            variant: "destructive",
          })
        } else if (attempts >= maxAttempts) {
          // Timeout
          clearInterval(pollInterval)
          setIsVerifying(false)
          
          toast({
            title: "Payment Verification Timeout",
            description: "Please verify your payment status manually",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Payment verification error:', error)
      }
    }, 5000)
  }

  const handleManualVerification = async () => {
    if (!transactionId || !providerTransactionId || !provider) return

    setIsVerifying(true)

    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          providerTransactionId,
          provider,
        }),
      })

      const data = await response.json()

      if (data.status === 'completed') {
        setPaymentStatus('completed')
        toast({
          title: "Payment Successful! 🎉",
          description: "Your payment has been confirmed",
        })

        if (onSuccess) {
          onSuccess(transactionId)
        }

        setTimeout(() => {
          onOpenChange(false)
          resetDialog()
        }, 3000)
      } else if (data.status === 'failed') {
        setPaymentStatus('failed')
        toast({
          title: "Payment Failed",
          description: data.failureReason || "The payment was not completed",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Payment Status",
          description: `Payment is still ${data.status}. Please check again in a few moments.`,
        })
      }
    } catch (error) {
      console.error('Manual verification error:', error)
      toast({
        title: "Error",
        description: "Failed to verify payment status",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const resetDialog = () => {
    setProvider(null)
    setPhoneNumber("")
    setPaymentInitiated(false)
    setTransactionId(null)
    setProviderTransactionId(null)
    setPaymentStatus(null)
    setIsProcessing(false)
    setIsVerifying(false)
  }

  const handleClose = () => {
    if (!isProcessing && !isVerifying) {
      onOpenChange(false)
      setTimeout(resetDialog, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mobile Money Payment</DialogTitle>
          <DialogDescription>
            Pay {formatPrice(amount)} for {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Code Display */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Property Code</div>
            <div className="font-mono text-2xl font-bold">{propertyCode}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Amount: <span className="font-semibold text-foreground">{formatPrice(amount)}</span>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className={`rounded-lg p-4 border ${
              paymentStatus === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
              paymentStatus === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
              'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                {paymentStatus === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : paymentStatus === 'failed' ? (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                )}
                <div>
                  <div className="font-semibold">
                    {paymentStatus === 'completed' ? 'Payment Successful!' :
                     paymentStatus === 'failed' ? 'Payment Failed' :
                     'Processing Payment...'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {paymentStatus === 'completed' ? 'Your payment has been confirmed' :
                     paymentStatus === 'failed' ? 'Please try again or use a different method' :
                     'Please complete the payment on your phone'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!paymentInitiated ? (
            <>
              {/* Provider Selection */}
              <div className="space-y-3">
                <Label>Select Your Mobile Money Provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProviderSelect('airtel')}
                    className={`relative overflow-hidden rounded-lg border-2 p-6 transition-all hover:scale-105 ${
                      provider === 'airtel'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-border hover:border-red-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-bold text-red-600">Airtel</div>
                      <div className="text-xs text-muted-foreground">Airtel Money</div>
                    </div>
                    {provider === 'airtel' && (
                      <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-red-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleProviderSelect('mtn')}
                    className={`relative overflow-hidden rounded-lg border-2 p-6 transition-all hover:scale-105 ${
                      provider === 'mtn'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-border hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-bold text-yellow-600">MTN</div>
                      <div className="text-xs text-muted-foreground">Mobile Money</div>
                    </div>
                    {provider === 'mtn' && (
                      <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-yellow-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phone Number Input */}
              {provider && (
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0771234567 or 256771234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your {provider === 'airtel' ? 'Airtel' : 'MTN'} mobile money number
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInitiatePayment}
                  className="flex-1 gap-2"
                  disabled={!provider || !phoneNumber || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      Pay Now
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Payment Instructions */}
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Complete Payment on Your Phone
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                        <li>Check your phone for a payment prompt</li>
                        <li>Enter your Mobile Money PIN</li>
                        <li>Confirm the payment</li>
                        <li>Wait for confirmation</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {transactionId && (
                  <div className="text-xs text-muted-foreground">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </div>
                )}
              </div>

              {/* Verification Button */}
              {!isVerifying && paymentStatus !== 'completed' && (
                <Button
                  onClick={handleManualVerification}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isVerifying}
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Payment Status
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
