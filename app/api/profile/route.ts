import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch current user's profile
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch base profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch profile", details: profileError.message },
        { status: 500 }
      )
    }

    // Fetch extended tenant profile
    const { data: tenantProfile, error: tenantError } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // It's okay if tenant profile doesn't exist yet
    if (tenantError && tenantError.code !== 'PGRST116') {
      console.error("Error fetching tenant profile:", tenantError)
    }

    return NextResponse.json({
      profile,
      tenant_profile: tenantProfile || null
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update user's profile
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { profile, tenant_profile } = body
    
    console.log("📝 Update request received:", {
      user_id: user.id,
      has_profile_data: !!profile,
      has_tenant_profile_data: !!tenant_profile,
      tenant_profile_keys: tenant_profile ? Object.keys(tenant_profile) : []
    })

    // Update base profile if provided
    if (profile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
        return NextResponse.json(
          { 
            error: "Failed to update profile", 
            details: profileError.message,
            code: profileError.code,
            hint: profileError.hint
          },
          { status: 500 }
        )
      }
    }

    // Update or create tenant profile if provided
    if (tenant_profile) {
      // Check if tenant profile exists
      console.log("🔍 Checking for existing tenant profile...")
      const { data: existingProfile, error: checkError } = await supabase
        .from("tenant_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("❌ Error checking tenant profile:", checkError)
      }
      
      console.log("✅ Existing profile check:", {
        exists: !!existingProfile,
        profile_id: existingProfile?.id
      })

      if (existingProfile) {
        // Update existing tenant profile
        const { error: tenantError } = await supabase
          .from("tenant_profiles")
          .update({
            phone_number: tenant_profile.phone_number,
            date_of_birth: tenant_profile.date_of_birth,
            national_id: tenant_profile.national_id,
            national_id_type: tenant_profile.national_id_type,
            home_address: tenant_profile.home_address,
            home_city: tenant_profile.home_city,
            home_district: tenant_profile.home_district,
            home_postal_code: tenant_profile.home_postal_code,
            employment_status: tenant_profile.employment_status,
            employer_name: tenant_profile.employer_name,
            employer_contact: tenant_profile.employer_contact,
            employment_start_date: tenant_profile.employment_start_date,
            monthly_income_ugx: tenant_profile.monthly_income_ugx,
            employment_type: tenant_profile.employment_type,
            preferred_communication: tenant_profile.preferred_communication,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)

        if (tenantError) {
          console.error("Tenant profile update error:", tenantError)
          return NextResponse.json(
            { 
              error: "Failed to update tenant profile", 
              details: tenantError.message,
              code: tenantError.code,
              hint: tenantError.hint
            },
            { status: 500 }
          )
        }
      } else {
        // Create new tenant profile
        const { error: tenantError } = await supabase
          .from("tenant_profiles")
          .insert({
            user_id: user.id,
            phone_number: tenant_profile.phone_number,
            date_of_birth: tenant_profile.date_of_birth,
            national_id: tenant_profile.national_id,
            national_id_type: tenant_profile.national_id_type,
            home_address: tenant_profile.home_address,
            home_city: tenant_profile.home_city,
            home_district: tenant_profile.home_district,
            home_postal_code: tenant_profile.home_postal_code,
            employment_status: tenant_profile.employment_status,
            employer_name: tenant_profile.employer_name,
            employer_contact: tenant_profile.employer_contact,
            employment_start_date: tenant_profile.employment_start_date,
            monthly_income_ugx: tenant_profile.monthly_income_ugx,
            employment_type: tenant_profile.employment_type,
            preferred_communication: tenant_profile.preferred_communication
          })

        if (tenantError) {
          console.error("Tenant profile creation error:", {
            message: tenantError.message,
            code: tenantError.code,
            details: tenantError.details,
            hint: tenantError.hint,
            user_id: user.id
          })
          return NextResponse.json(
            { 
              error: "Failed to create tenant profile", 
              details: tenantError.message,
              code: tenantError.code,
              hint: tenantError.hint
            },
            { status: 500 }
          )
        }
      }
    }

    // Fetch updated data
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const { data: updatedTenantProfile } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
      tenant_profile: updatedTenantProfile || null
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete user's tenant profile (not the base profile for safety)
export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Delete tenant profile (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("tenant_profiles")
      .delete()
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete tenant profile", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Tenant profile deleted successfully"
    })
  } catch (error) {
    console.error("Profile delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
