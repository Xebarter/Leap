"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Calendar,
  CreditCard,
  DollarSign,
  ArrowRight,
  Building2,
  Hash,
  CheckCircle2,
  MapPin,
  Bed,
  Bath,
  Square,
  Sparkles,
  Lock,
  Eye,
} from "lucide-react"
import { Unit } from "@/components/publicView/building-block-visualization"
import { formatUnitNumber } from "@/lib/unit-number-generator"
import { ReservePropertyDialog } from "./reserve-property-dialog"
import { ScheduleVisitDialog } from "./schedule-visit-dialog"
import { MobileMoneyPaymentDialog } from "./mobile-money-payment-dialog"

interface UnitActionDialogProps {
  unit: Unit | null
  propertyId: string
  propertyTitle: string
  propertyLocation: string
  propertyCode: string
  open: boolean
  onOpenChange: (open: boolean) => void
  minimumDepositMonths?: number
}

type ActionType = "reserve" | "pay" | "visit" | null

export function UnitActionDialog({
  unit,
  propertyId,
  propertyTitle,
  propertyLocation,
  propertyCode,
  open,
  onOpenChange,
  minimumDepositMonths,
}: UnitActionDialogProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType>(null)
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false)
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  // Reset selected action when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAction(null)
    }
  }, [open])

  // Close main dialog when sub-dialog opens
  useEffect(() => {
    if (reserveDialogOpen || visitDialogOpen || paymentDialogOpen) {
      onOpenChange(false)
    }
  }, [reserveDialogOpen, visitDialogOpen, paymentDialogOpen, onOpenChange])

  if (!unit) return null

  const formattedPrice = unit.price 
    ? (unit.price / 100).toLocaleString() 
    : "N/A"

  const unitTitle = `${propertyTitle} - Unit ${unit.unitNumber}`

  const isOccupied = unit.is_occupied === true

  const actions = [
    {
      type: "reserve" as ActionType,
      icon: Home,
      title: "Reserve Unit",
      description: "Submit an application to reserve this unit",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      disabled: isOccupied,
      available: unit.isAvailable,
      badge: "Popular",
      badgeColor: "bg-blue-600",
    },
    {
      type: "pay" as ActionType,
      icon: CreditCard,
      title: "Make Payment",
      description: isOccupied ? "Unit is already occupied" : "Pay rent or deposit for this unit",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      available: !isOccupied,
      badge: isOccupied ? "Occupied" : "Instant",
      badgeColor: isOccupied ? "bg-gray-600" : "bg-emerald-600",
      disabled: isOccupied,
    },
    {
      type: "visit" as ActionType,
      icon: Calendar,
      title: "Schedule Visit",
      description: "Book a time to view this unit in person",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      available: unit.isAvailable,
      badge: "Free",
      badgeColor: "bg-purple-600",
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Clean Professional Header */}
          <div className="relative -mt-6 -mx-6 px-6 pt-8 pb-6 bg-muted/30 border-b">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="flex items-center gap-3 text-3xl font-bold">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-foreground">
                      Unit {unit.unitNumber}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-base pl-1">
                    Choose your preferred action below
                  </DialogDescription>
                </div>
                
                {unit.price && (
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-bold text-primary">
                      {formattedPrice}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">UGX/month</p>
                  </div>
                )}
              </div>
            </DialogHeader>
          </div>

          {/* Clean Professional Unit Details Card */}
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Unit Header with Clean Badges */}
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="text-sm px-3 py-1 bg-primary text-primary-foreground">
                        {unit.type}
                      </Badge>
                      {unit.isAvailable ? (
                        <Badge className="text-sm px-3 py-1 bg-green-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Available Now
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          Occupied
                        </Badge>
                      )}
                    </div>
                    
                    {unit.uniqueId && (
                      <div className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2 w-fit border">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Unit ID:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatUnitNumber(unit.uniqueId)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Clean Unit Specifications Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
                    <Building2 className="h-5 w-5 text-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Floor</span>
                    <span className="font-bold text-lg">{unit.floor}</span>
                  </div>
                  
                  {unit.bedrooms !== undefined && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
                      <Bed className="h-5 w-5 text-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Bedrooms</span>
                      <span className="font-bold text-lg">{unit.bedrooms}</span>
                    </div>
                  )}
                  
                  {unit.bathrooms !== undefined && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
                      <Bath className="h-5 w-5 text-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Bathrooms</span>
                      <span className="font-bold text-lg">{unit.bathrooms}</span>
                    </div>
                  )}
                  
                  {unit.area && (
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors border">
                      <Square className="h-5 w-5 text-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Area</span>
                      <span className="font-bold text-lg">{unit.area}m²</span>
                    </div>
                  )}
                </div>

                {/* Property Location */}
                {propertyLocation && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
                    <div className="p-2 rounded-lg bg-background border">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{propertyLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clean Professional Action Cards */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Choose an Action
              </h3>
              <Badge variant="outline" className="text-xs">
                {actions.filter(a => a.available).length} Available
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actions.map((action) => {
                const Icon = action.icon
                const isDisabled = !action.available || action.disabled

                return (
                  <button
                    key={action.type}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedAction(action.type)
                        // Open the corresponding dialog
                        if (action.type === "reserve") {
                          setReserveDialogOpen(true)
                        } else if (action.type === "visit") {
                          setVisitDialogOpen(true)
                        } else if (action.type === "pay") {
                          setPaymentDialogOpen(true)
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      group relative rounded-lg border-2 transition-all duration-200 text-left
                      ${action.bgColor} ${action.borderColor}
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed grayscale' 
                        : 'cursor-pointer hover:shadow-lg hover:border-opacity-80 active:scale-[0.98]'
                      }
                      ${selectedAction === action.type ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : ''}
                    `}
                  >
                    {/* Badge */}
                    <div className={`absolute top-3 right-3 ${action.badgeColor} text-white text-xs px-2 py-0.5 rounded-md font-medium`}>
                      {action.badge}
                    </div>
                    
                    <div className="relative p-5 space-y-3">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg ${action.iconBg} flex items-center justify-center ${action.iconColor} border`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg leading-tight text-gray-950">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-700 leading-snug">
                          {action.description}
                        </p>
                      </div>
                      
                      {/* CTA Arrow */}
                      {!isDisabled && (
                        <div className="flex items-center text-sm font-semibold text-gray-800 pt-1">
                          <span>Continue</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                      
                      {/* Disabled State */}
                      {isDisabled && action.type === "reserve" && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Not Available
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clean Help Text */}
          <div className="mt-6 p-4 bg-muted rounded-lg border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-background border shrink-0">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Pro Tip</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Schedule a visit to view the unit before making any commitments. It's completely free!
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <ReservePropertyDialog
        propertyId={propertyId}
        propertyTitle={unitTitle}
        propertyLocation={propertyLocation}
        monthlyRent={unit.price || 0}
        propertyCode={unit.uniqueId || propertyCode}
        open={reserveDialogOpen}
        onOpenChange={(open) => {
          setReserveDialogOpen(open)
          // Reopen main dialog if sub-dialog is closed
          if (!open && !visitDialogOpen && !paymentDialogOpen) {
            onOpenChange(true)
          }
        }}
        unitDetails={{
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          type: unit.type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
        }}
      />

      <ScheduleVisitDialog
        propertyId={propertyId}
        propertyTitle={unitTitle}
        propertyLocation={propertyLocation}
        open={visitDialogOpen}
        onOpenChange={(open) => {
          setVisitDialogOpen(open)
          // Reopen main dialog if sub-dialog is closed
          if (!open && !reserveDialogOpen && !paymentDialogOpen) {
            onOpenChange(true)
          }
        }}
      />

      <MobileMoneyPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          // Reopen main dialog if sub-dialog is closed
          if (!open && !reserveDialogOpen && !visitDialogOpen) {
            onOpenChange(true)
          }
        }}
        amount={((unit.price || 0) / 100) * (minimumDepositMonths || 1)}
        monthlyAmount={(unit.price || 0) / 100}
        depositMonths={minimumDepositMonths || 1}
        propertyCode={unit.uniqueId || propertyCode}
        propertyTitle={unitTitle}
        propertyId={propertyId}
        onSuccess={(transactionId) => {
          // Handle successful payment
        }}
      />
    </>
  )
}
