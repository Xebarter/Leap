import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { email, password, fullName, isAdmin, userType } = await request.json()

    console.log("Signup attempt for email:", email)
    console.log("Full name:", fullName)
    console.log("Is admin:", isAdmin)
    console.log("User type:", userType)

    if (!email || !password) {
      console.error("Missing email or password")
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    // Determine the role and user_type based on isAdmin and userType
    const role = isAdmin ? 'admin' : (userType === 'landlord' ? 'landlord' : 'tenant')
    const finalUserType = isAdmin ? 'admin' : (userType || 'tenant')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          full_name: fullName,
          is_admin: isAdmin,
          role: role,
          user_type: finalUserType,
        },
      },
    })

    if (error) {
      console.error("Supabase signup error:", error.message, error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("Signup successful for:", email, "with role:", role)
    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    console.error("Signup API error:", err)
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 500 },
    )
  }
}
