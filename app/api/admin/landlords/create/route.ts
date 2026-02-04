import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const {
      email,
      password,
      full_name,
      phone,
      national_id,
      address,
      city,
      country,
      commission_rate,
      payment_terms,
      bank_name,
      bank_account_number,
      bank_account_name,
      mobile_money_number,
      mobile_money_provider,
      tax_id,
      business_registration_number
    } = body

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      )
    }

    // Create user account in Supabase Auth with service role
    // Use admin client with service role key for admin operations
    const supabaseAdmin = createAdminClient()

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role: "landlord",
        user_type: "landlord",
      },
    })

    if (createUserError || !newUser.user) {
      console.error("Error creating user:", createUserError)
      return NextResponse.json(
        { error: createUserError?.message || "Failed to create user account" },
        { status: 400 }
      )
    }

    // Ensure a basic profile entry exists for the landlord.
    // Note: many deployments have an `on_auth_user_created` trigger that already inserts into `profiles`.
    // In that case a plain insert will fail with a duplicate key error. Use upsert to be safe.
    const { error: basicProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUser.user.id,
          email,
          full_name,
          role: "landlord",
          is_admin: false,
        },
        { onConflict: "id" }
      )

    if (basicProfileError) {
      console.error("Error creating basic profile:", basicProfileError)
      // If profile creation fails, rollback user creation
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 400 }
      )
    }

    // Create landlord profile using admin client to bypass RLS
    // NOTE: landlord_profiles schema (see scripts/LANDLORDS_SCHEMA.sql) uses:
    // - phone_number (not phone)
    // - business_address (not address)
    // - does NOT include full_name/email (those live in public.profiles)
    // - uses id_document_* fields for identity details
    // - uses payment_schedule (not payment_terms)
    const { data: landlordProfile, error: profileError } = await supabaseAdmin
      .from("landlord_profiles")
      .insert({
        user_id: newUser.user.id,
        business_registration_number: business_registration_number || tax_id || null,
        phone_number: phone || null,
        business_address: address || null,
        city: city || null,
        // No `country` column in this schema
        commission_rate: commission_rate || 0,
        payment_schedule: payment_terms || null,
        bank_name: bank_name || null,
        bank_account_number: bank_account_number || null,
        bank_account_name: bank_account_name || null,
        mobile_money_number: mobile_money_number || null,
        mobile_money_provider: mobile_money_provider || null,
        id_document_type: national_id ? "National ID" : null,
        id_document_number: national_id || null,
        status: "active",
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating landlord profile:", profileError)
      // Rollback: Delete the user account if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { error: profileError.message || "Failed to create landlord profile" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: "Landlord created successfully",
        landlord: landlordProfile,
        user_id: newUser.user.id
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error in landlord creation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
