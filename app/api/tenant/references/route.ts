import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch tenant references
export async function GET(request: Request) {
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

    // Get tenant profile
    const { data: tenantProfile, error: profileError } = await supabase
      .from("tenant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      )
    }

    // Get references
    const { data: references, error: referencesError } = await supabase
      .from("tenant_references")
      .select("*")
      .eq("tenant_profile_id", tenantProfile.id)
      .order("created_at", { ascending: false })

    if (referencesError) {
      console.error("Error fetching references:", referencesError)
      return NextResponse.json(
        { error: "Failed to fetch references", details: referencesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ references: references || [] })
  } catch (error: any) {
    console.error("Error in GET /api/tenant/references:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new reference
export async function POST(request: Request) {
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

    // Get tenant profile
    const { data: tenantProfile, error: profileError } = await supabase
      .from("tenant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found. Please complete your profile first." },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      reference_type,
      reference_name,
      reference_title,
      reference_company,
      reference_email,
      reference_phone,
      reference_address,
    } = body

    // Validate required fields
    if (!reference_type || !reference_name || !reference_title || !reference_email || !reference_phone) {
      return NextResponse.json(
        { error: "Missing required fields: reference_type, reference_name, reference_title, reference_email, reference_phone" },
        { status: 400 }
      )
    }

    // Insert reference record
    const { data: reference, error: insertError } = await supabase
      .from("tenant_references")
      .insert({
        tenant_profile_id: tenantProfile.id,
        reference_type,
        reference_name,
        reference_title,
        reference_company,
        reference_email,
        reference_phone,
        reference_address,
        verification_status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting reference:", insertError)
      return NextResponse.json(
        { error: "Failed to add reference", details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "Reference added successfully",
        reference
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error in POST /api/tenant/references:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update existing reference
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

    // Parse request body
    const body = await request.json()
    const {
      id,
      reference_type,
      reference_name,
      reference_title,
      reference_company,
      reference_email,
      reference_phone,
      reference_address,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      )
    }

    // Get tenant profile
    const { data: tenantProfile, error: profileError } = await supabase
      .from("tenant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      )
    }

    // Verify ownership before updating
    const { data: existingRef, error: checkError } = await supabase
      .from("tenant_references")
      .select("id")
      .eq("id", id)
      .eq("tenant_profile_id", tenantProfile.id)
      .single()

    if (checkError || !existingRef) {
      return NextResponse.json(
        { error: "Reference not found or you don't have permission to update it" },
        { status: 404 }
      )
    }

    // Update reference
    const { data: updatedReference, error: updateError } = await supabase
      .from("tenant_references")
      .update({
        reference_type,
        reference_name,
        reference_title,
        reference_company,
        reference_email,
        reference_phone,
        reference_address,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("tenant_profile_id", tenantProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating reference:", updateError)
      return NextResponse.json(
        { error: "Failed to update reference", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "Reference updated successfully",
        reference: updatedReference
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in PUT /api/tenant/references:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a reference
export async function DELETE(request: Request) {
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

    // Get reference ID from query params
    const { searchParams } = new URL(request.url)
    const referenceId = searchParams.get("id")

    if (!referenceId) {
      return NextResponse.json(
        { error: "Reference ID is required" },
        { status: 400 }
      )
    }

    // Get tenant profile
    const { data: tenantProfile, error: profileError } = await supabase
      .from("tenant_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      )
    }

    // Delete reference (with ownership check)
    const { error: deleteError } = await supabase
      .from("tenant_references")
      .delete()
      .eq("id", referenceId)
      .eq("tenant_profile_id", tenantProfile.id)

    if (deleteError) {
      console.error("Error deleting reference:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete reference", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Reference deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in DELETE /api/tenant/references:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
