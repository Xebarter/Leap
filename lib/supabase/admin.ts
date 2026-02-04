import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with service role privileges
 * This should ONLY be used in server-side API routes for admin operations
 * NEVER expose the service role key to the client
 */
export function createAdminClient() {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
        throw new Error('Missing Supabase environment variables for admin client')
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SECRET_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
