import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Download a specific document
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const documentId = params.id

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

    // Get document to verify ownership
    const { data: document, error: docError } = await supabase
      .from("tenant_documents")
      .select("*")
      .eq("id", documentId)
      .eq("tenant_profile_id", tenantProfile.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or you don't have permission to access it" },
        { status: 404 }
      )
    }

    // Get signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("tenant-documents")
      .createSignedUrl(document.document_storage_path, 3600)

    if (urlError || !signedUrlData) {
      console.error("Error creating signed URL:", urlError)
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      document: document
    })
  } catch (error: any) {
    console.error("Error in GET /api/tenant/documents/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
