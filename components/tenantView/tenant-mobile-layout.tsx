'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TenantSidebar } from './tenant-sidebar'
import Image from 'next/image'

interface TenantMobileLayoutProps {
  user: any
  children: React.ReactNode
}

export function TenantMobileLayout({ user, children }: TenantMobileLayoutProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Leap Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-bold text-xl tracking-tighter">Leap</span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden relative z-50"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <TenantSidebar user={user} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* User Info on Mobile */}
        <div className="px-4 pb-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 pt-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {getInitial(user)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {user?.user_metadata?.full_name || 'Tenant'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'guest@example.com'}
              </p>
            </div>
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
