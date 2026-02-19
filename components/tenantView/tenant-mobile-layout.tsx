'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TenantSidebar } from './tenant-sidebar'
import Image from 'next/image'
import Link from 'next/link'

interface TenantMobileLayoutProps {
  user: any
  children: React.ReactNode
}

export function TenantMobileLayout({ user, children }: TenantMobileLayoutProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/tenant" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Leap Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="font-bold text-2xl tracking-tighter hidden sm:inline">Leap</span>
          </Link>

          {/* User Avatar & Menu */}
          <div className="flex items-center gap-3">
            {/* User Avatar - Hidden on very small screens */}
            <div className="hidden xs:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                {getInitial(user)}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-semibold truncate max-w-[120px]">
                  {user?.user_metadata?.full_name || 'Tenant'}
                </p>
              </div>
            </div>

            {/* Menu Button */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Toggle navigation menu">
                {mounted && open ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 sm:w-80">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <TenantSidebar user={user} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar + Main Content */}
      <div className="flex">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block">
          <TenantSidebar user={user} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

function getInitial(user: any): string {
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name.charAt(0).toUpperCase()
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'T'
}
