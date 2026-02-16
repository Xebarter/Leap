"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, Mail, Phone, MapPin, Sparkles, CheckCircle2, LogIn, UserPlus, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { TwoStepAuthWrapper } from "./two-step-auth-wrapper"

interface ScheduleVisitDialogProps {
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  triggerButton?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ScheduleVisitDialog({
  propertyId,
  propertyTitle,
  propertyLocation,
  triggerButton,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: ScheduleVisitDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [minDate, setMinDate] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [scheduledDetails, setScheduledDetails] = useState<{ date: string; time: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [timeConstraints, setTimeConstraints] = useState({ min: "08:00", max: "18:00" })
  const router = useRouter()

  // Set minimum date (tomorrow) on client side
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setMinDate(tomorrow.toISOString().split("T")[0])
  }, [])

  // Update time constraints based on selected date (Sunday vs other days)
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate)
      const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      
      if (dayOfWeek === 0) {
        // Sunday: 2:00 PM - 6:00 PM
        setTimeConstraints({ min: "14:00", max: "18:00" })
      } else {
        // Monday to Saturday: 8:00 AM - 6:00 PM
        setTimeConstraints({ min: "08:00", max: "18:00" })
      }
    }
  }, [selectedDate])

  // Handle successful authentication
  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Get form values
    const visitorName = formData.get("visitor_name") as string
    const visitorEmail = formData.get("visitor_email") as string
    const visitorPhone = formData.get("visitor_phone") as string
    const visitDate = formData.get("visit_date") as string
    const visitTime = formData.get("visit_time") as string
    const visitNotes = formData.get("visit_notes") as string

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9+\-\s()]{10,}$/
    if (!phoneRegex.test(visitorPhone)) {
      toast.error("Please enter a valid phone number")
      setIsLoading(false)
      return
    }

    // Prepare booking data
    const bookingData: any = {
      property_id: propertyId,
      booking_type: "visit",
      visit_date: visitDate,
      visit_time: visitTime,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_phone: visitorPhone,
      visit_notes: visitNotes || null,
      status: "pending",
      number_of_guests: 1,
      tenant_id: currentUser.id,
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single()

      if (error) throw error

      // Success! Show success state
      setScheduledDetails({ date: visitDate, time: visitTime })
      setIsSuccess(true)
      
      toast.success("Visit scheduled successfully!", {
        description: `We'll see you on ${new Date(visitDate).toLocaleDateString()} at ${visitTime}`,
      })

      // If user is logged in, redirect to their dashboard after showing success
      if (currentUser) {
        setTimeout(() => {
          setOpen(false)
          setIsSuccess(false)
          router.push("/tenant")
        }, 3000)
      } else {
        // For anonymous users, close after 3 seconds
        setTimeout(() => {
          setOpen(false)
          setIsSuccess(false)
        }, 3000)
      }
    } catch (error: any) {
      console.error("Error scheduling visit:", error)
      toast.error("Failed to schedule visit", {
        description: error.message || "Please try again or contact support",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="w-full gap-2">
            <Calendar className="w-4 h-4" />
            Schedule a Visit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {isSuccess ? (
          /* Success State */
          <>
            <VisuallyHidden.Root>
              <DialogTitle>Visit Scheduled!</DialogTitle>
            </VisuallyHidden.Root>
            <div className="p-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Visit Scheduled!</h3>
                <p className="text-muted-foreground">
                  Your visit to <strong className="text-foreground">{propertyTitle}</strong> has been confirmed.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {scheduledDetails && new Date(scheduledDetails.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{scheduledDetails?.time}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation to your email. See you soon!
                </p>
                {currentUser && (
                  <p className="text-xs text-muted-foreground">
                    Redirecting to your dashboard...
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <TwoStepAuthWrapper
            open={open}
            onOpenChange={setOpen}
            authTitle="Create Your Account to Schedule Visit"
            authDescription="Quick sign-up - takes less than 30 seconds"
            contentTitle="Schedule Your Visit"
            authBadge={
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Free Visit
              </Badge>
            }
            onAuthSuccess={handleAuthSuccess}
          >
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-8">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Step 2 of 2
                </Badge>
              </div>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-bold">Schedule Your Visit</DialogTitle>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <DialogDescription className="text-base">
                    Book a time to visit <strong className="text-foreground">{propertyTitle}</strong> at {propertyLocation}
                  </DialogDescription>
                </div>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="grid gap-6 p-6 max-h-[60vh] overflow-y-auto">
                {/* Visitor Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-sm font-semibold">Your Information</h4>
              </div>
              
              <div className="grid gap-4 pl-10">
                <div className="grid gap-2">
                  <Label htmlFor="visitor_name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="visitor_name"
                      name="visitor_name"
                      placeholder="John Doe"
                      defaultValue={currentUser?.user_metadata?.full_name || ""}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="visitor_email" className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="visitor_email"
                      name="visitor_email"
                      type="email"
                      placeholder="john@example.com"
                      defaultValue={currentUser?.email || ""}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="visitor_phone" className="text-sm font-medium">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="visitor_phone"
                      name="visitor_phone"
                      type="tel"
                      placeholder="+256 700 000 000"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll use this to confirm your visit
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Visit Schedule Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <h4 className="text-sm font-semibold">Visit Schedule</h4>
              </div>

              {/* Available Hours Information Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Clock className="w-4 h-4" />
                  <span>Available Visiting Hours</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monday - Saturday</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">2:00 PM - 6:00 PM</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 pl-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="visit_date" className="text-sm font-medium">
                      Visit Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="visit_date"
                        name="visit_date"
                        type="date"
                        min={minDate}
                        className="pl-10"
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visit_time" className="text-sm font-medium">
                      Visit Time <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="visit_time"
                        name="visit_time"
                        type="time"
                        min={timeConstraints.min}
                        max={timeConstraints.max}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                {selectedDate && (
                  <div className={`rounded-lg p-3 flex items-start gap-2 border ${
                    new Date(selectedDate).getDay() === 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                      : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  }`}>
                    <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      new Date(selectedDate).getDay() === 0 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                    <p className={`text-xs font-medium ${
                      new Date(selectedDate).getDay() === 0 
                        ? 'text-amber-700 dark:text-amber-300' 
                        : 'text-green-700 dark:text-green-300'
                    }`}>
                      {new Date(selectedDate).getDay() === 0 
                        ? "Selected: Sunday - Available 2:00 PM to 6:00 PM only"
                        : `Selected: ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })} - Available 8:00 AM to 6:00 PM`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Notes Section */}
            <div className="grid gap-3">
              <Label htmlFor="visit_notes" className="text-sm font-medium">
                Additional Notes or Questions <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="visit_notes"
                name="visit_notes"
                placeholder="Tell us what you'd like to see or any questions you have about the property..."
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Footer with actions */}
          <div className="border-t bg-muted/20 p-6 mt-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>No payment required. Free visit with no obligation.</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="gap-2 min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Confirm Visit
                    </>
                  )}
                </Button>
              </div>
              </div>
            </div>
          </form>
          </TwoStepAuthWrapper>
        )}
      </DialogContent>
    </Dialog>
  )
}
