"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Calendar, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingVisit, setPendingVisit] = useState<any>(null)
  const userType = searchParams.get('type') || 'tenant' // tenant or landlord

  // Check for pending visit and redirect URL
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'schedule-visit') {
      const storedVisit = localStorage.getItem('pendingVisit')
      if (storedVisit) {
        setPendingVisit(JSON.parse(storedVisit))
      }
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      
      let data, signInError
      try {
        const response = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        data = response.data
        signInError = response.error
      } catch (fetchError: any) {
        console.error('Network error during login:', fetchError)
        throw new Error('Unable to connect to authentication service. Please check your internet connection.')
      }
      
      if (signInError) throw signInError

      // Fetch user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, user_type, role')
        .eq('id', data?.user?.id)
        .single()

      // Check for redirect URL from visit scheduling
      const redirectUrl = searchParams.get('redirect')
      const action = searchParams.get('action')
      
      if (redirectUrl && action === 'schedule-visit') {
        // Redirect back to property page
        router.push(decodeURIComponent(redirectUrl))
        router.refresh()
        return
      }

      // Role-based redirection
      const isAdmin = profile?.is_admin || data?.user?.user_metadata?.is_admin
      const isLandlord = profile?.user_type === 'landlord' || profile?.role === 'landlord'
      
      if (isAdmin) {
        router.push("/admin")
      } else if (isLandlord) {
        router.push("/landlord")
      } else {
        router.push("/tenant")
      }
      router.refresh()
    } catch (err: any) {
      console.error('Login error:', err)
      // Handle network/fetch errors specifically
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        setError("Unable to connect to authentication service. Please check your internet connection or contact support.")
      } else {
        setError(err?.message || "An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      let signInError
      try {
        const response = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        signInError = response.error
      } catch (fetchError: any) {
        console.error('Network error during Google login:', fetchError)
        throw new Error('Unable to connect to authentication service. Please check your internet connection.')
      }
      
      if (signInError) throw signInError
    } catch (err: any) {
      console.error('Google login error:', err)
      // Handle network/fetch errors specifically
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        setError("Unable to connect to authentication service. Please check your internet connection or contact support.")
      } else {
        setError(err?.message || "An error occurred")
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {pendingVisit && (
          <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Continue scheduling your visit</p>
                <p className="text-xs text-muted-foreground">
                  Sign in to book your visit to <strong>{pendingVisit.propertyTitle}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {pendingVisit 
                ? 'Sign in to Continue' 
                : userType === 'landlord' 
                  ? 'Landlord Login' 
                  : 'Tenant Login'
              }
            </CardTitle>
            <CardDescription>
              {pendingVisit 
                ? 'Enter your credentials to schedule your property visit'
                : userType === 'landlord'
                  ? 'Sign in to manage your properties and tenants'
                  : 'Sign in to find and rent your perfect home'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/forgot-password" className="underline underline-offset-4 text-muted-foreground">
                  Forgot password?
                </Link>
              </div>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link 
                  href={pendingVisit 
                    ? `/auth/sign-up?redirect=${searchParams.get('redirect')}&action=schedule-visit`
                    : `/auth/sign-up${userType ? `?type=${userType}` : ''}`
                  } 
                  className="underline underline-offset-4"
                >
                  Sign up
                </Link>
              </div>
              {userType === 'landlord' && (
                <div className="text-center text-xs text-muted-foreground">
                  Looking for a property?{" "}
                  <Link 
                    href="/auth/login?type=tenant" 
                    className="underline underline-offset-4 text-primary"
                  >
                    Sign in as tenant
                  </Link>
                </div>
              )}
              {userType === 'tenant' && (
                <div className="text-center text-xs text-muted-foreground">
                  Have properties to rent?{" "}
                  <Link 
                    href="/auth/login?type=landlord" 
                    className="underline underline-offset-4 text-primary"
                  >
                    Sign in as landlord
                  </Link>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
