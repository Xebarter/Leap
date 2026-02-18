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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Mail, Phone, MapPin, Sparkles, CheckCircle2, LogIn, UserPlus, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
  const [selectedHour, setSelectedHour] = useState("")
  const [selectedMinute, setSelectedMinute] = useState("00")
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM")
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

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: "AM" | "PM"): string => {
    let hour24 = parseInt(hour)
    
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0
    }
    
    return `${hour24.toString().padStart(2, "0")}:${minute}`
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
    const visitNotes = formData.get("visit_notes") as string
    
    // Validate time selection
    if (!selectedHour || !selectedMinute || !selectedPeriod) {
      toast.error("Please select a complete time (hour, minute, and AM/PM)")
      setIsLoading(false)
      return
    }

    // Convert 12-hour time to 24-hour format for storage
    const visitTime = convertTo24Hour(selectedHour, selectedMinute, selectedPeriod)
    
    // Validate time is within business hours
    const [hours, minutes] = visitTime.split(":").map(Number)
    const timeInMinutes = hours * 60 + minutes
    const selectedDay = new Date(visitDate).getDay()
    
    if (selectedDay === 0) {
      // Sunday: 2:00 PM - 6:00 PM (14:00 - 18:00)
      const minTime = 14 * 60 // 2:00 PM
      const maxTime = 18 * 60 // 6:00 PM
      if (timeInMinutes < minTime || timeInMinutes >= maxTime) {
        toast.error("On Sundays, visits are only available between 2:00 PM and 6:00 PM")
        setIsLoading(false)
        return
      }
    } else {
      // Monday-Saturday: 8:00 AM - 6:00 PM (08:00 - 18:00)
      const minTime = 8 * 60 // 8:00 AM
      const maxTime = 18 * 60 // 6:00 PM
      if (timeInMinutes < minTime || timeInMinutes >= maxTime) {
        toast.error("Visits are only available between 8:00 AM and 6:00 PM")
        setIsLoading(false)
        return
      }
    }

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
      // Only include tenant_id if user is authenticated
      ...(currentUser && { tenant_id: currentUser.id }),
    }

    try {
      console.log("🔍 Attempting to insert booking data:", bookingData)
      
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single()

      console.log("📊 Supabase response - Data:", data)
      console.log("📊 Supabase response - Error:", error)

      if (error) {
        console.error("❌ Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      // Success! Show success state
      console.log("✅ Visit scheduled successfully:", data)
      const displayTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`
      setScheduledDetails({ date: visitDate, time: displayTime })
      setIsSuccess(true)
      
      toast.success("Visit scheduled successfully!", {
        description: `We'll see you on ${new Date(visitDate).toLocaleDateString()} at ${displayTime}`,
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
      console.error("❌ Error scheduling visit:", error)
      console.error("❌ Error type:", typeof error)
      console.error("❌ Error keys:", Object.keys(error))
      
      toast.error("Failed to schedule visit", {
        description: error.message || error.details || "Please try again or contact support",
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
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Hidden title for accessibility - always present */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isSuccess ? "Visit Scheduled!" : "Schedule Your Visit"}
          </DialogTitle>
        </DialogHeader>
        
        {isSuccess ? (
          /* Success State */
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
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4">
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Step 2 of 2
                </Badge>
              </div>
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-bold">Schedule Your Visit</DialogTitle>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <DialogDescription className="text-sm">
                    Book a time to visit <strong className="text-foreground">{propertyTitle}</strong> at {propertyLocation}
                  </DialogDescription>
                </div>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="grid gap-4 p-4 overflow-y-auto flex-1">
                {/* Visitor Information Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold">Your Information</h4>
              </div>
              
              <div className="grid gap-3 pl-9">
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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold">Visit Schedule</h4>
              </div>

              {/* Available Hours Information Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Available Visiting Hours</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mon - Sat</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">2:00 PM - 6:00 PM</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-3 pl-9">
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
                    <div className="grid grid-cols-3 gap-2">
                      {/* Hour Selection */}
                      <Select value={selectedHour} onValueChange={setSelectedHour} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Minute Selection */}
                      <Select value={selectedMinute} onValueChange={setSelectedMinute} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* AM/PM Selection */}
                      <Select value={selectedPeriod} onValueChange={(val) => setSelectedPeriod(val as "AM" | "PM")} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
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
            <div className="grid gap-2">
              <Label htmlFor="visit_notes" className="text-sm font-medium">
                Additional Notes or Questions <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="visit_notes"
                name="visit_notes"
                placeholder="Tell us what you'd like to see or any questions you have about the property..."
                className="min-h-[60px] resize-none"
              />
            </div>

            <Separator />

            {/* Footer with actions */}
            <div className="bg-muted/20 p-4 -mx-4 -mb-4 rounded-b-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
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
          </div>
        </form>
          </TwoStepAuthWrapper>
        )}
      </DialogContent>
    </Dialog>
  )
}
