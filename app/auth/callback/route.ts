import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Fetch user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, user_type, role')
        .eq('id', data.user.id)
        .single()

      // Redirect based on role
      const isAdmin = profile?.is_admin || data.user?.user_metadata?.is_admin
      const isLandlord = profile?.user_type === 'landlord' || profile?.role === 'landlord'
      
      let redirectPath = '/' // Tenants go to home page
      if (isAdmin) {
        redirectPath = '/admin'
      } else if (isLandlord) {
        redirectPath = '/landlord'
      }
      
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
