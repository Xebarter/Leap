'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import LandlordSidebar from './landlord-sidebar'

export function LandlordMobileLayout({
  user,
  landlordProfile,
  displayName,
  children,
}: {
  user: any
  landlordProfile: any
  displayName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const initial = getInitial(displayName)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-background rounded-full" />
            </div>
            <span className="font-bold text-xl tracking-tighter">Leap</span>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button 
                className="lg:hidden relative z-50 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <LandlordSidebar landlordProfile={landlordProfile} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* User Info on Mobile */}
        <div className="px-4 pb-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-3 pt-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'guest@example.com'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar + Main Content */}
      <div className="flex">
        <div className="hidden lg:block">
          <LandlordSidebar landlordProfile={landlordProfile} />
        </div>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}

function getInitial(displayName: string): string {
  const name = (displayName || '').trim()
  if (name) return name.charAt(0).toUpperCase()
  return 'L'
}
