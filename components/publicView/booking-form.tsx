"use client"

import type React from "react"
import { formatPrice } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function BookingForm({ property, userId }: { property: any; userId?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [propertyUnits, setPropertyUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isUnitsLoading, setIsUnitsLoading] = useState(true);
  const [minDate, setMinDate] = useState('');
  const router = useRouter()

  // Set minimum date on client side to prevent hydration mismatch
  useEffect(() => {
    setMinDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Check if this property is part of a block with multiple units
  const isPartOfBlock = property.property_units && property.property_units.length > 0;

  // Fetch units for this property if it's part of a block
  useEffect(() => {
    if (isPartOfBlock) {
      const fetchUnits = async () => {
        try {
          const supabase = createClient();
          
          const { data, error } = await supabase
            .from('property_units')
            .select(`
              id,
              unit_number,
              floor_number,
              is_available,
              property_id
            `)
            .eq('block_id', property.property_units[0].block_id)
            .eq('is_available', true);
            
          if (error) throw error;
          
          if (data) {
            setPropertyUnits(data);
            // Select the first available unit by default
            if (data.length > 0) {
              setSelectedUnitId(data[0].id);
            }
          }
        } catch (err) {
          const errorMessage = typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
          console.error("Error fetching property units:", errorMessage);
          toast.error("Failed to load available units");
        } finally {
          setIsUnitsLoading(false);
        }
      };

      fetchUnits();
    } else {
      setIsUnitsLoading(false);
    }
  }, [isPartOfBlock, property.property_units]);

  // Calculate days between two dates
  const calculateDays = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate months between two dates (approximately)
  const calculateMonths = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();
    const totalMonths = yearsDiff * 12 + monthsDiff;
    
    // Check if we need to add an additional month based on days
    if (end.getDate() > start.getDate()) {
      return totalMonths + 1;
    }
    return totalMonths;
  };

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userId) {
      router.push("/auth/login")
      return
    }

    // If property is part of a block, we need a unit to be selected
    if (isPartOfBlock && !selectedUnitId) {
      toast.error("Please select a unit to book");
      return;
    }

    setIsLoading(true)
    const supabase = createClient()
    const formData = new FormData(e.currentTarget)

    const checkIn = formData.get("checkIn") as string
    const checkOut = formData.get("checkOut") as string

    // Calculate the duration in months
    const monthsCount = calculateMonths(checkIn, checkOut);
    const minMonthsRequired = property.minimum_initial_months || 1;

    // Validate that the booking duration meets the minimum requirement
    if (monthsCount < minMonthsRequired) {
      toast.error(`Minimum initial deposit required is ${minMonthsRequired} month${minMonthsRequired > 1 ? 's' : ''}`);
      setIsLoading(false);
      return;
    }

    // Calculate the total price based on months
    const monthlyPrice = property.price_ugx || property.price_per_night; // Use price_ugx if available, otherwise fallback
    const calculatedTotal = monthlyPrice * monthsCount;

    // Prepare booking data
    const bookingData: any = {
      property_id: property.id,
      tenant_id: userId,
      check_in: checkIn,
      check_out: checkOut,
      status: "confirmed",
      total_price_ugx: calculatedTotal, // Use the correct field name
    };

    // If property is part of a block, add the unit ID to the booking
    if (isPartOfBlock && selectedUnitId) {
      bookingData.unit_id = selectedUnitId;
      
      // Update the unit to mark it as unavailable
      const { error: unitUpdateError } = await supabase
        .from('property_units')
        .update({ is_available: false })
        .eq('id', selectedUnitId);
        
      if (unitUpdateError) {
        console.error("Error updating unit availability:", unitUpdateError);
        toast.error("Failed to update unit availability");
        setIsLoading(false);
        return;
      }
    }

    const { error } = await supabase.from("bookings").insert(bookingData)

    if (!error) {
      setSuccess(true)
      setTimeout(() => router.push("/dashboard"), 2000)
    } else {
      console.error("Booking error:", error);
      toast.error("Failed to make booking. Please try again.");
      
      // If booking failed but we already updated the unit availability, revert it
      if (isPartOfBlock && selectedUnitId) {
        const { error: revertError } = await supabase
          .from('property_units')
          .update({ is_available: true })
          .eq('id', selectedUnitId);
          
        if (revertError) {
          console.error("Error reverting unit availability:", revertError);
        }
      }
    }
    setIsLoading(false)
  }

  return (
    <Card className="border shadow-xl bg-card">
      <CardHeader className="border-b">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{formatPrice(property.price_ugx / 100)}</span>
          <span className="text-muted-foreground text-sm">per month</span>
        </div>
        {property.minimum_initial_months && property.minimum_initial_months > 1 && (
          <div className="text-sm text-muted-foreground mt-1">
            Minimum {property.minimum_initial_months} {property.minimum_initial_months > 1 ? 'months' : 'month'} deposit required
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-green-500 text-4xl">✓</div>
            <h3 className="font-bold text-xl">Booking Successful!</h3>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-4">
            {/* Unit selection for properties that are part of a block */}
            {isPartOfBlock && (
              <div className="space-y-2">
                <Label>Select Unit</Label>
                {isUnitsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading available units...</div>
                ) : propertyUnits.length > 0 ? (
                  <Select 
                    value={selectedUnitId ?? ''} 
                    onValueChange={setSelectedUnitId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Floor {unit.floor_number}, Unit {unit.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-destructive">No units available for booking</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 border rounded-lg overflow-hidden">
              <div className="p-3 border-r bg-muted/30">
                <Label htmlFor="checkIn" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Check-in
                </Label>
                <Input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  className="border-none p-0 h-auto focus-visible:ring-0 shadow-none bg-transparent"
                  required
                  min={minDate} // Prevent booking in the past
                />
              </div>
              <div className="p-3 bg-muted/30">
                <Label htmlFor="checkOut" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Checkout
                </Label>
                <Input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  className="border-none p-0 h-auto focus-visible:ring-0 shadow-none bg-transparent"
                  required
                  min={minDate} // Prevent booking in the past
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground font-bold h-12"
              disabled={isLoading || (isPartOfBlock && (!selectedUnitId || propertyUnits.length === 0))}
            >
              {isLoading ? "Processing..." : userId ? "Reserve Now" : "Login to Reserve"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You won't be charged yet
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}