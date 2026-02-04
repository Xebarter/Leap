import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check if user is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { id } = await params
    const reservationId = id

    console.log("Attempting to cancel reservation:", reservationId)

    // First, verify the reservation belongs to the user
    const { data: reservation, error: fetchError } = await supabase
      .from("property_reservations")
      .select("id, status, tenant_id, payment_status")
      .eq("id", reservationId)
      .single()

    if (fetchError) {
      console.error("Error fetching reservation:", fetchError)
      return NextResponse.json(
        { error: "Reservation not found", details: fetchError.message },
        { status: 404 }
      )
    }

    if (!reservation) {
      console.error("No reservation found with ID:", reservationId)
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
    }

    // Check if the reservation belongs to the current user
    if (reservation.tenant_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this reservation" },
        { status: 403 }
      )
    }

    // Check if reservation can be cancelled (only pending or confirmed)
    if (reservation.status !== "pending" && reservation.status !== "confirmed") {
      return NextResponse.json(
        { error: "This reservation cannot be cancelled" },
        { status: 400 }
      )
    }

    // Check if payment is still pending (cannot cancel paid reservations)
    if (reservation.payment_status !== "pending" && reservation.payment_status !== "failed") {
      return NextResponse.json(
        { error: "Cannot cancel a reservation with completed payment. Please contact support for refunds." },
        { status: 400 }
      )
    }

    // Update the reservation status to cancelled
    const { data: updatedReservation, error: updateError } = await supabase
      .from("property_reservations")
      .update({ 
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", reservationId)
      .select()
      .single()

    if (updateError) {
      console.error("Error cancelling reservation:", updateError)
      return NextResponse.json(
        { error: "Failed to cancel reservation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Reservation cancelled successfully",
      reservation: updatedReservation,
    })
  } catch (error) {
    console.error("Error in DELETE /api/reservations/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
