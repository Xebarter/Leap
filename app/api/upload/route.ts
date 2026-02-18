import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client with service role for storage operations
    let supabaseAdmin
    try {
      supabaseAdmin = createAdminClient()
    } catch (error: any) {
      console.error('Failed to create admin client:', error)
      return NextResponse.json(
        { 
          error: 'Storage service configuration error', 
          details: error.message || 'Missing Supabase environment variables'
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const filePath = formData.get('filePath') as string
    const bucket = (formData.get('bucket') as string) || 'property-images' // Default to property-images

    if (!file || !filePath) {
      return NextResponse.json(
        { error: 'File and filePath are required' },
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase storage using service role
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Storage upload error:', error)
      
      // Provide more helpful error message for RLS issues
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        console.error('❌ RLS Policy Error - Run scripts/FIX_STORAGE_RLS_POLICIES.sql')
        return NextResponse.json(
          { 
            error: 'Storage permissions not configured. Please run the SQL fix in scripts/FIX_STORAGE_RLS_POLICIES.sql',
            details: error.message
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Create a signed URL that's valid for 10 years (for permanent storage)
    // This bypasses RLS and allows secure access to the file
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, 315360000) // 10 years in seconds

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to create signed URL', details: signedUrlError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: signedUrlData.signedUrl,
      path: data.path
    })
  } catch (error: any) {
    console.error('Upload error:', error)

    // Return real error details to help debug env/config issues
    const message = error?.message || 'Upload failed'
    return NextResponse.json(
      { error: 'Upload failed', details: message },
      { status: 500 }
    )
  }
}
