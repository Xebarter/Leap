import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create a Supabase client with service role for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // Use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
