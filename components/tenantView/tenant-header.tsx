'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Settings, LogOut } from 'lucide-react'

export function TenantHeader({ user }: { user: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', href: '/tenant' },
    { label: 'Profile', href: '/tenant/profile' },
    { label: 'Documents', href: '/tenant/documents' },
    { label: 'Payments', href: '/tenant/payments' },
    { label: 'Maintenance', href: '/tenant/maintenance' },
    { label: 'Notices', href: '/tenant/notices' },
    { label: 'Complaints', href: '/tenant/complaints' },
  ]

  return (
    <>
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="text-sm">
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center gap-4">
              {/* Desktop User Menu */}
              <div className="hidden sm:flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                  <Link href="/settings">
                    <Settings className="w-5 h-5" />
                  </Link>
                </Button>
                <form action="/auth/logout" method="post">
                  <Button variant="ghost" size="icon" type="submit">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </form>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="w-full justify-start text-sm" onClick={() => setMobileMenuOpen(false)}>
                  <Link href={item.href}>
                    {item.label}
                  </Link>
                </Button>
              ))}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <Button asChild variant="ghost" className="w-full justify-start text-sm">
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <form action="/auth/logout" method="post" className="w-full">
                  <Button variant="ghost" className="w-full justify-start text-sm text-destructive" type="submit">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* User Info Bar (Optional - shown on desktop) */}
      <div className="hidden sm:block border-b border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {getInitial(user)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'Tenant'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'guest@example.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
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
