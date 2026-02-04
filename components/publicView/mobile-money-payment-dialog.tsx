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
  Phone,
  ArrowRight,
  Info,
  Check
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
  monthlyAmount?: number
  depositMonths?: number
  propertyId?: string
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
  monthlyAmount,
  depositMonths,
  propertyId,
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

  // Check if this is a free property (amount is 0)
  const isFreeProperty = amount === 0 || amount === null

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

  const handleFreePropertyOccupancy = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/payments/free-occupancy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          propertyCode,
          monthsPaid: depositMonths || 1,
          propertyTitle,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentStatus('completed')
        
        toast({
          title: "Success! 🎉",
          description: "Property reserved successfully",
        })

        // Call success callback
        if (onSuccess) {
          onSuccess(data.occupancyId || 'free-property')
        }

        // Close dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false)
          resetDialog()
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reserve property",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Free property occupancy error:', error)
      toast({
        title: "Error",
        description: "An error occurred while reserving the property",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInitiatePayment = async () => {
    // Handle free properties
    if (isFreeProperty) {
      await handleFreePropertyOccupancy()
      return
    }

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
          propertyId,
          monthsPaid: depositMonths,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTransactionId(data.transactionId)
        setProviderTransactionId(data.providerTransactionId)
        setPaymentInitiated(true)
        
        // Check if payment is already successful (sandbox mode)
        if (data.status === 'successful') {
          setPaymentStatus('completed')
          
          toast({
            title: "Payment Successful! 🎉",
            description: data.message || "Your payment has been completed",
          })

          // Call success callback
          if (onSuccess) {
            onSuccess(data.transactionId)
          }

          // Close dialog after 2 seconds
          setTimeout(() => {
            onOpenChange(false)
            resetDialog()
          }, 2000)
        } else {
          // Payment pending - start polling
          setPaymentStatus('pending')
          
          toast({
            title: "Payment Initiated",
            description: data.message || "Please check your phone to complete the payment",
          })

          // Start polling for payment status
          startPaymentVerification(data.transactionId, data.providerTransactionId)
        }
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || data.error || "Failed to initiate payment",
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary" />
            </div>
            {isFreeProperty ? 'Confirm Reservation' : 'Mobile Money Payment'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isFreeProperty ? (
              <>Reserve <span className="font-semibold text-foreground">{propertyTitle}</span> at no cost</>
            ) : (
              <>Pay <span className="font-semibold text-foreground">{formatPrice(amount)}</span> for {propertyTitle}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Code Display */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-lg p-5 border border-primary/20">
            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Property Code</div>
            <div className="font-mono text-3xl font-bold text-primary mb-3 tracking-tight">{propertyCode}</div>
            
            {/* Payment Breakdown */}
            {monthlyAmount && depositMonths ? (
              <div className="space-y-2 pt-3 border-t border-primary/10">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Payment Breakdown</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-semibold text-foreground">{formatPrice(monthlyAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Number of Months</span>
                    <span className="font-semibold text-foreground">{depositMonths} {depositMonths === 1 ? 'month' : 'months'}</span>
                  </div>
                  <div className="h-px bg-primary/20 my-2"></div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Total Deposit Amount</span>
                    <span className="font-bold text-lg text-primary">{formatPrice(amount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm pt-3 border-t border-primary/10">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="font-bold text-lg text-foreground">{formatPrice(amount)}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className={`rounded-xl p-5 border-2 animate-in slide-in-from-top-3 duration-500 ${
              paymentStatus === 'completed' ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300 dark:from-green-950/30 dark:to-green-950/10 dark:border-green-700' :
              paymentStatus === 'failed' ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300 dark:from-red-950/30 dark:to-red-950/10 dark:border-red-700' :
              'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300 dark:from-blue-950/30 dark:to-blue-950/10 dark:border-blue-700'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  paymentStatus === 'completed' ? 'bg-green-500' :
                  paymentStatus === 'failed' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}>
                  {paymentStatus === 'completed' ? (
                    <CheckCircle2 className="w-7 h-7 text-white animate-in zoom-in duration-500" />
                  ) : paymentStatus === 'failed' ? (
                    <AlertCircle className="w-7 h-7 text-white" />
                  ) : (
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-bold text-lg mb-1">
                    {paymentStatus === 'completed' ? '🎉 Payment Successful!' :
                     paymentStatus === 'failed' ? 'Payment Failed' :
                     'Processing Payment...'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {paymentStatus === 'completed' ? 'Your payment has been confirmed and your reservation is now active' :
                     paymentStatus === 'failed' ? 'The payment could not be completed. Please try again or contact support.' :
                     'Please check your phone and approve the payment request'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!paymentInitiated ? (
            <>
              {isFreeProperty ? (
                <>
                  {/* Free Property Confirmation */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-950/10 border-2 border-green-300 dark:border-green-700 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-2 text-green-900 dark:text-green-100">
                          Free Property
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <p>This property is available at no cost.</p>
                          <p>Click the button below to confirm your reservation.</p>
                          {depositMonths && (
                            <p className="font-medium mt-2">Duration: {depositMonths} {depositMonths === 1 ? 'month' : 'months'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
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
                      className="flex-1 gap-2 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-xl transition-all"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Reservation</span>
                          <ArrowRight className="w-4 h-4 ml-auto" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Provider Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Your Mobile Money Provider</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('airtel')}
                    className={`relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      provider === 'airtel'
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-md'
                        : 'border-border hover:border-red-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-bold text-red-600">Airtel</div>
                      <div className="text-xs text-muted-foreground font-medium">Airtel Money</div>
                    </div>
                    {provider === 'airtel' && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center animate-in zoom-in duration-300">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderSelect('mtn')}
                    className={`relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      provider === 'mtn'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 shadow-md'
                        : 'border-border hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl font-bold text-yellow-600">MTN</div>
                      <div className="text-xs text-muted-foreground font-medium">Mobile Money</div>
                    </div>
                    {provider === 'mtn' && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center animate-in zoom-in duration-300">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Phone Number Input */}
              {provider && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="phone" className="text-base font-medium">
                    {provider === 'airtel' ? 'Airtel' : 'MTN'} Mobile Money Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0771234567 or 256771234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-12 text-base"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5" />
                    <span>Enter the number you'll use to approve the payment</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
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
                  className="flex-1 gap-2 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all"
                  disabled={!provider || !phoneNumber || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initiating Payment...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Pay Now</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </Button>
              </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Payment Instructions */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-950/10 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5 animate-in slide-in-from-right-3 duration-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm flex-1">
                      <p className="font-bold text-base text-blue-900 dark:text-blue-100 mb-3">
                        Complete Payment on Your Phone
                      </p>
                      <ol className="space-y-2 text-blue-700 dark:text-blue-300">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">1</span>
                          <span>Check your phone for a payment prompt</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">2</span>
                          <span>Enter your Mobile Money PIN</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">3</span>
                          <span>Confirm the payment amount</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">4</span>
                          <span>Wait for confirmation message</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {transactionId && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Transaction ID</div>
                    <div className="font-mono text-sm font-semibold">{transactionId}</div>
                  </div>
                )}

                {isVerifying && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">Verifying payment...</span>
                  </div>
                )}
              </div>

              {/* Verification Button */}
              {!isVerifying && paymentStatus !== 'completed' && (
                <Button
                  onClick={handleManualVerification}
                  variant="outline"
                  className="w-full gap-2 h-11 border-2 hover:bg-primary/5 hover:border-primary"
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
