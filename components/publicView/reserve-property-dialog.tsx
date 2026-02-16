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
import { Progress } from "@/components/ui/progress"
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
  Info,
  Loader2,
  AlertCircle,
  Check,
  Sparkles
} from "lucide-react"
import { format, addDays } from "date-fns"
import { TwoStepAuthWrapper } from "./two-step-auth-wrapper"

interface ReservePropertyDialogProps {
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  monthlyRent: number // in cents
  propertyCode: string // 10-digit unique identifier
  triggerButton?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  unitDetails?: {
    unitNumber: string
    floor: number
    type: string
    bedrooms?: number
    bathrooms?: number
  }
}

export function ReservePropertyDialog({
  propertyId,
  propertyTitle,
  propertyLocation,
  monthlyRent,
  propertyCode,
  triggerButton,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  unitDetails,
}: ReservePropertyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [reservationDetails, setReservationDetails] = useState<any>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  // Handle successful authentication
  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user)
  }

  // Form validation
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {}
    
    if (name === 'contact_phone') {
      const phoneRegex = /^(\+256|0)?[7][0-9]{8}$/
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        errors.contact_phone = 'Please enter a valid Ugandan phone number'
      }
    }
    
    if (name === 'contact_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.contact_email = 'Please enter a valid email address'
      }
    }
    
    if (name === 'move_in_date') {
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.move_in_date = 'Move-in date cannot be in the past'
      }
    }
    
    setFormErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      })
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

    // Validate all fields
    const isPhoneValid = validateField('contact_phone', contactPhone)
    const isEmailValid = validateField('contact_email', contactEmail)
    const isDateValid = validateField('move_in_date', moveInDate)

    if (!isPhoneValid || !isEmailValid || !isDateValid) {
      setIsLoading(false)
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

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
      toast({
        title: "Reservation Failed",
        description: error.message || "Failed to create reservation. Please try again.",
        variant: "destructive",
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
      title: "Reservation Created! 🎉",
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
        {isSuccess ? (
          /* Success State */
          <div className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center animate-in zoom-in duration-700">
                <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in duration-500 delay-200" />
              </div>
              
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                <DialogTitle className="text-2xl font-bold">Reservation Created! 🎉</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Your property reservation has been successfully submitted
                </DialogDescription>
              </div>
            </DialogHeader>

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
                    className="w-full gap-2 animate-pulse hover:animate-none bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay with Mobile Money
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-950/10 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5 animate-in slide-in-from-bottom-2 duration-500 delay-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm text-left flex-1">
                  <p className="font-bold text-base text-blue-900 dark:text-blue-100 mb-3">Next Steps:</p>
                  <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Complete payment using Mobile Money if you selected it</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Use Property Code: <strong className="font-mono text-base">{propertyCode}</strong> for reference</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Track your reservation in the tenant dashboard</span>
                    </li>
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
              className="w-full gap-2 h-11 hover:bg-primary/5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        ) : (
          /* Reservation Form */
          <TwoStepAuthWrapper
            open={open}
            onOpenChange={setOpen}
            authTitle="Create Your Account to Reserve"
            authDescription="Secure your dream property in just 30 seconds"
            contentTitle="Reserve Property"
            authBadge={
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Priority Access
              </Badge>
            }
            onAuthSuccess={handleAuthSuccess}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
              <div className="flex items-center justify-between">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Home className="w-6 h-6 text-primary" />
                    Reserve Property
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    Secure this property by paying one month's rent upfront
                  </DialogDescription>
                </DialogHeader>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Step 2 of 2
                </Badge>
              </div>
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
                  {unitDetails && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Unit Number</span>
                        <Badge variant="secondary" className="font-mono">{unitDetails.unitNumber}</Badge>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Floor</span>
                        <span className="text-sm text-right">Floor {unitDetails.floor}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Unit Type</span>
                        <span className="text-sm text-right">{unitDetails.type}</span>
                      </div>
                      {(unitDetails.bedrooms || unitDetails.bathrooms) && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Configuration</span>
                          <span className="text-sm text-right">
                            {unitDetails.bedrooms && `${unitDetails.bedrooms} BR`}
                            {unitDetails.bedrooms && unitDetails.bathrooms && ' • '}
                            {unitDetails.bathrooms && `${unitDetails.bathrooms} BA`}
                          </span>
                        </div>
                      )}
                    </>
                  )}
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
                        className={`pl-10 ${formErrors.contact_phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        onChange={(e) => validateField('contact_phone', e.target.value)}
                        required
                      />
                      {formErrors.contact_phone && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.contact_phone}
                        </div>
                      )}
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
                        className={`pl-10 ${formErrors.contact_email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        defaultValue={currentUser?.email}
                        onChange={(e) => validateField('contact_email', e.target.value)}
                        required
                      />
                      {formErrors.contact_email && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.contact_email}
                        </div>
                      )}
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
                      className={`pl-10 ${formErrors.move_in_date ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => validateField('move_in_date', e.target.value)}
                      required
                    />
                    {formErrors.move_in_date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.move_in_date}
                      </div>
                    )}
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
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      id="payment_method"
                      name="payment_method"
                      className="flex h-12 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                      required
                    >
                      <option value="">Choose your payment method</option>
                      <option value="mobile_money">📱 Mobile Money (MTN/Airtel)</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="card">💳 Credit/Debit Card</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Mobile Money is recommended for instant payment</span>
                  </p>
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
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm flex-1">
                    <p className="font-bold text-base text-amber-900 dark:text-amber-100 mb-2">
                      Reservation Valid for 30 Days
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
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
                  className="flex-1 gap-2 relative overflow-hidden group"
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0 animate-shimmer" />
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Reserve Property
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TwoStepAuthWrapper>
        )}
      </DialogContent>

      {/* Mobile Money Payment Dialog */}
      {reservationDetails && showPaymentDialog && (
        <MobileMoneyPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          amount={reservationDetails.amount}
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
