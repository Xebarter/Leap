import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Check if email exists in auth users
    const supabaseAdmin = createAdminClient()
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    return NextResponse.json({
      available: !emailExists,
      email: email,
    })
  } catch (error: any) {
    console.error("Error checking email availability:", error)
    return NextResponse.json(
      { error: "Failed to check email availability" },
      { status: 500 }
    )
  }
}
