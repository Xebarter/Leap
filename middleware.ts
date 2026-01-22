import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

async function handler(request: NextRequest) {
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

  if (isPublicPath) {
    return supabaseResponse
  }

  if (!user && isProtectedPage) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPage && !request.nextUrl.pathname.includes('/callback') && !request.nextUrl.pathname.includes('/logout')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || user.user_metadata?.is_admin
    const redirectPath = isAdmin ? '/admin' : '/tenant'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  if (user && isProtectedPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || user.user_metadata?.is_admin

    if (isAdmin && isTenantPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (!isAdmin && isAdminPage) {
      return NextResponse.redirect(new URL('/tenant', request.url))
    }
  }

  return supabaseResponse
}

export const middleware = handler

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
