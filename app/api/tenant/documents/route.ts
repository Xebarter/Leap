import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch tenant documents
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

    // Get documents
    const { data: documents, error: documentsError } = await supabase
      .from("tenant_documents")
      .select("*")
      .eq("tenant_profile_id", tenantProfile.id)
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error fetching documents:", documentsError)
      return NextResponse.json(
        { error: "Failed to fetch documents", details: documentsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error: any) {
    console.error("Error in GET /api/tenant/documents:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Upload new document
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("document_type") as string
    const documentName = formData.get("document_name") as string
    const expiryDate = formData.get("expiry_date") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!documentType || !documentName) {
      return NextResponse.json(
        { error: "Missing required fields: document_type and document_name" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png"
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed." },
        { status: 400 }
      )
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop()
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}-${documentType.replace(/\s+/g, "-")}.${fileExt}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("tenant-documents")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file", details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL (even though bucket is private, we need the path)
    const { data: urlData } = supabase.storage
      .from("tenant-documents")
      .getPublicUrl(fileName)

    // Insert document record into database
    const { data: documentRecord, error: insertError } = await supabase
      .from("tenant_documents")
      .insert({
        tenant_profile_id: tenantProfile.id,
        document_type: documentType,
        document_name: documentName,
        document_url: urlData.publicUrl,
        document_storage_path: fileName,
        status: "pending",
        expiry_date: expiryDate || null,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      // Delete uploaded file if database insert fails
      await supabase.storage
        .from("tenant-documents")
        .remove([fileName])
      
      console.error("Error inserting document record:", insertError)
      return NextResponse.json(
        { error: "Failed to save document record", details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "Document uploaded successfully",
        document: documentRecord
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error in POST /api/tenant/documents:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a document
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

    // Get document ID from query params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("id")

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
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

    // Get document to verify ownership and get storage path
    const { data: document, error: docError } = await supabase
      .from("tenant_documents")
      .select("*")
      .eq("id", documentId)
      .eq("tenant_profile_id", tenantProfile.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found or you don't have permission to delete it" },
        { status: 404 }
      )
    }

    // Delete from storage
    if (document.document_storage_path) {
      const { error: storageError } = await supabase.storage
        .from("tenant-documents")
        .remove([document.document_storage_path])

      if (storageError) {
        console.error("Error deleting file from storage:", storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("tenant_documents")
      .delete()
      .eq("id", documentId)
      .eq("tenant_profile_id", tenantProfile.id)

    if (deleteError) {
      console.error("Error deleting document record:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete document", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error in DELETE /api/tenant/documents:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
