import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Access environment variables - these are injected at build time by Next.js
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables:', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseAnonKey ? 'present' : 'missing'
    })
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
