'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    getUser()
  }, [])

  const isAdmin = user?.user_metadata?.is_admin

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
          <Image
            src="/logo.png"
            alt="Leap Logo"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <span className="hidden sm:inline">Leap</span>
        </Link>
        <nav className="flex items-center gap-4">
          {/* Always show dashboard links for easier testing */}
          <Button asChild variant="ghost">
            <Link href="/tenant">Tenant</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin">Admin</Link>
          </Button>
          {user ? (
            <form action="/auth/logout" method="post">
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
