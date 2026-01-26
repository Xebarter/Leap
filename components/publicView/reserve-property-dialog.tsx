"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { MobileMoneyPaymentDialog } from "./mobile-money-payment-dialog"
import { 
  Home, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Shield, 
  CreditCard,
  Clock,
  User,
  MapPin,
  ArrowRight,
  LogIn,
  UserPlus,
  Info
} from "lucide-react"
import { format, addDays } from "date-fns"

interface ReservePropertyDialogProps {
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  monthlyRent: number // in cents
  propertyCode: string // 10-digit unique identifier
  triggerButton?: React.ReactNode
}

export function ReservePropertyDialog({
  propertyId,
  propertyTitle,
  propertyLocation,
  monthlyRent,
  propertyCode,
  triggerButton,
}: ReservePropertyDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [reservationDetails, setReservationDetails] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      setIsCheckingAuth(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
      setIsCheckingAuth(false)
      
      // If not logged in when dialog opens, show auth prompt
      if (!user && open) {
        setShowAuthPrompt(true)
      }
    }
    checkUser()
  }, [open])

  // Save reservation context for after authentication
  const saveReservationContext = () => {
    const context = {
      propertyId,
      propertyTitle,
      propertyLocation,
      monthlyRent,
      timestamp: Date.now(),
    }
    localStorage.setItem('pendingReservation', JSON.stringify(context))
  }

  // Handle authentication redirect
  const handleAuthRedirect = (type: 'login' | 'signup') => {
    saveReservationContext()
    const returnUrl = encodeURIComponent(window.location.pathname)
    router.push(`/auth/${type === 'login' ? 'login' : 'sign-up'}?redirect=${returnUrl}&action=reserve-property`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!currentUser) {
      setShowAuthPrompt(true)
      return
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions")
      return
    }
    
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Get form values
    const contactPhone = formData.get("contact_phone") as string
    const contactEmail = formData.get("contact_email") as string
    const moveInDate = formData.get("move_in_date") as string
    const notes = formData.get("notes") as string
    const paymentMethod = formData.get("payment_method") as string

    // Calculate expiry date (30 days from now)
    const expiresAt = addDays(new Date(), 30)

    // Prepare reservation data
    const reservationData = {
      property_id: propertyId,
      tenant_id: currentUser.id,
      reservation_amount: monthlyRent, // 1 month rent in cents
      payment_method: paymentMethod,
      payment_status: "pending",
      status: "pending",
      expires_at: expiresAt.toISOString(),
      move_in_date: moveInDate,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      notes: notes || null,
      terms_accepted: termsAccepted,
    }

    // Insert reservation
    const { data, error } = await supabase
      .from("property_reservations")
      .insert(reservationData)
      .select()
      .single()

    setIsLoading(false)

    if (error) {
      console.error("Error creating reservation:", error)
      toast.error("Failed to create reservation", {
        description: error.message,
      })
      return
    }

    // Success!
    setReservationDetails({
      ...data,
      reservationId: data.id,
      reservationNumber: data.reservation_number,
      expiresAt: format(new Date(data.expires_at), "PPP"),
      amount: data.reservation_amount,
      paymentMethod: data.payment_method,
    })
    setIsSuccess(true)

    toast({
      title: "Success!",
      description: `Your reservation number is ${data.reservation_number}`,
    })
  }

  // Format price
  const formattedAmount = (monthlyRent / 100).toLocaleString()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="lg" className="gap-2">
            <Home className="w-4 h-4" />
            Reserve Property
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {showAuthPrompt ? (
          /* Authentication Required Prompt */
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Sign in to Reserve Property</h3>
                <p className="text-muted-foreground">
                  Create a free tenant account or sign in to reserve this property
                </p>
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 space-y-3 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{propertyTitle}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {propertyLocation}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="default" className="font-bold">
                      UGX {formattedAmount}
                    </Badge>
                    <span className="text-xs text-muted-foreground">reservation fee (1 month rent)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Secure your property by:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Paying 1 month rent as reservation fee
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Securing the property for 30 days
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Getting priority for move-in
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Tracking your reservation status
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => handleAuthRedirect('signup')}
                className="w-full gap-2"
                size="lg"
              >
                <UserPlus className="w-4 h-4" />
                Create Tenant Account
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button 
                onClick={() => handleAuthRedirect('login')}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Existing Account
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAuthPrompt(false)
                  setOpen(false)
                }}
                className="text-sm text-muted-foreground"
              >
                Maybe later
              </Button>
            </div>
          </div>
        ) : isSuccess ? (
          /* Success State */
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Reservation Created!</h3>
              <p className="text-muted-foreground">
                Your property reservation has been successfully submitted
              </p>
            </div>

            {reservationDetails && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reservation Number</span>
                    <Badge variant="outline" className="font-mono">
                      {reservationDetails.reservationNumber}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Property Code</span>
                    <Badge variant="outline" className="font-mono text-lg">
                      {propertyCode}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">UGX {formattedAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">{reservationDetails.expiresAt}</span>
                  </div>
                </div>

                {reservationDetails.paymentMethod === 'mobile_money' && (
                  <Button 
                    onClick={() => setShowPaymentDialog(true)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay with Mobile Money
                  </Button>
                )}
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-left">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Next Steps:</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                    <li>• Complete payment using Mobile Money if you selected it</li>
                    <li>• Use Property Code: <strong>{propertyCode}</strong> for payment reference</li>
                    <li>• Track your reservation in the tenant dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setOpen(false)
                router.push("/tenant/visits")
              }}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          /* Reservation Form */
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Home className="w-6 h-6 text-primary" />
                  Reserve Property
                </DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Secure this property by paying one month's rent upfront
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Property Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Property Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">Property</span>
                    <span className="text-sm font-medium text-right">{propertyTitle}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm text-right">{propertyLocation}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reservation Amount</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">UGX {formattedAmount}</div>
                      <div className="text-xs text-muted-foreground">1 month rent</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Contact Information
                </h4>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        placeholder="+256 700 000 000"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        defaultValue={currentUser?.email}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="move_in_date">
                    Intended Move-in Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="move_in_date"
                      name="move_in_date"
                      type="date"
                      className="pl-10"
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Method
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_method">
                    Preferred Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="payment_method"
                    name="payment_method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="mobile_money">Mobile Money (MTN/Airtel)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special requests or information..."
                  rows={3}
                />
              </div>

              {/* Important Information */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Reservation Valid for 30 Days
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs">
                      Your reservation will be valid for 30 days from today. Complete payment within this period to confirm your reservation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to pay UGX {formattedAmount} as a reservation fee and understand that this amount will be applied towards my first month's rent upon move-in. I accept the{" "}
                  <a href="/terms" target="_blank" className="underline text-primary">
                    terms and conditions
                  </a>
                  .
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Reserve Property
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>

      {/* Mobile Money Payment Dialog */}
      {reservationDetails && showPaymentDialog && (
        <MobileMoneyPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          amount={reservationDetails.amount / 100}
          propertyCode={propertyCode}
          propertyTitle={propertyTitle}
          reservationId={reservationDetails.reservationId}
          onSuccess={(transactionId) => {
            toast({
              title: "Payment Successful!",
              description: "Your reservation has been confirmed",
            })
            setOpen(false)
            setShowPaymentDialog(false)
          }}
        />
      )}
    </Dialog>
  )
}
