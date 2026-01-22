import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables in proxy')
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (!error) {
      user = authUser
    }
  } catch (error) {
    console.error('Error getting user in proxy:', error)
    // Continue with user = null for graceful handling
  }

  const isPublicPath = request.nextUrl.pathname === '/' || 
                      request.nextUrl.pathname.startsWith('/(public)') ||
                      request.nextUrl.pathname.startsWith('/api/') ||
                      request.nextUrl.pathname.startsWith('/_next/') ||
                      request.nextUrl.pathname.startsWith('/favicon')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isTenantPage = request.nextUrl.pathname.startsWith('/tenant')
  const isProtectedPage = isAdminPage || isTenantPage

  // Allow public paths
  if (isPublicPath) {
    return supabaseResponse
  }

  // If user is not logged in and trying to access protected pages
  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  if (user && isAuthPage && !request.nextUrl.pathname.includes('/callback') && !request.nextUrl.pathname.includes('/logout')) {
    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || user.user_metadata?.is_admin
    const redirectPath = isAdmin ? '/admin' : '/tenant'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Check if user is accessing the correct dashboard based on role
  if (user && isProtectedPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || user.user_metadata?.is_admin

    // If admin trying to access tenant pages, redirect to admin
    if (isAdmin && isTenantPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // If non-admin trying to access admin pages, redirect to tenant
    if (!isAdmin && isAdminPage) {
      return NextResponse.redirect(new URL('/tenant', request.url))
    }
  }

  return supabaseResponse
}
