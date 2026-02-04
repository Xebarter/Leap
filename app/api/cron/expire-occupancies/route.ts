// ============================================================================
// CRON JOB API ENDPOINT - EXPIRE PROPERTY OCCUPANCIES
// ============================================================================
// This endpoint should be called by a cron service (e.g., Vercel Cron, cron-job.org)
// to automatically expire occupancies when the paid period ends.
//
// Schedule: Run daily at midnight (0 0 * * *)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron service (simple auth token)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Call the database function to expire occupancies
    const { data, error } = await supabase.rpc('expire_completed_occupancies')

    if (error) {
      console.error('Error expiring occupancies:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 500 }
      )
    }

    console.log(`Successfully expired ${data} occupancies`)

    return NextResponse.json({
      success: true,
      expiredCount: data,
      message: `Successfully expired ${data} occupancies`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering by admins
export async function POST(request: NextRequest) {
  return GET(request)
}
