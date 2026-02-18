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
import { Calendar, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          isAdmin,
          userType: isAdmin ? 'admin' : userType, // Pass the user type (tenant or landlord)
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error || "An error occurred while signing up.")
        setIsLoading(false)
        return
      }

      const { user, session } = body.data ?? {}

      if (user && session) {
        // Check for redirect URL from visit scheduling
        const redirectUrl = searchParams.get('redirect')
        const action = searchParams.get('action')
        
        if (redirectUrl && action === 'schedule-visit') {
          // Redirect back to property page
          router.push(decodeURIComponent(redirectUrl))
          router.refresh()
          return
        }

        const redirectPath = isAdmin ? '/admin' : userType === 'landlord' ? '/landlord' : '/tenant'
        router.push(redirectPath)
        router.refresh()
      } else {
        router.push("/auth/verify-email")
      }

      setIsLoading(false)
    } catch (err: any) {
      const message = err?.message || "An error occurred"
      if (message === 'Failed to fetch' || message.includes('fetch')) {
        setError("Unable to connect to authentication service. Please check your internet connection.")
      } else {
        setError(message)
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
                <p className="text-sm font-medium">Almost there! Create your account</p>
                <p className="text-xs text-muted-foreground">
                  Sign up to schedule your visit to <strong>{pendingVisit.propertyTitle}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {pendingVisit 
                ? 'Create Tenant Account' 
                : userType === 'landlord' 
                  ? 'Create Landlord Account' 
                  : 'Join Leap'}
            </CardTitle>
            <CardDescription>
              {pendingVisit 
                ? 'Create your account to schedule property visits and more'
                : userType === 'landlord'
                  ? 'Create an account to manage your properties and tenants'
                  : 'Create an account to start renting'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {!pendingVisit && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isAdmin" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                  <Label htmlFor="isAdmin">Register as Admin</Label>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link 
                  href={pendingVisit 
                    ? `/auth/login?redirect=${searchParams.get('redirect')}&action=schedule-visit`
                    : `/auth/login${userType ? `?type=${userType}` : ''}`
                  } 
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
              {userType === 'landlord' && !pendingVisit && (
                <div className="text-center text-xs text-muted-foreground">
                  Looking for a property?{" "}
                  <Link 
                    href="/auth/sign-up?type=tenant" 
                    className="underline underline-offset-4 text-primary"
                  >
                    Sign up as tenant
                  </Link>
                </div>
              )}
              {userType === 'tenant' && !pendingVisit && (
                <div className="text-center text-xs text-muted-foreground">
                  Have properties to rent?{" "}
                  <Link 
                    href="/auth/sign-up?type=landlord" 
                    className="underline underline-offset-4 text-primary"
                  >
                    Sign up as landlord
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
