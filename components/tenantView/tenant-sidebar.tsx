'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings, LogOut, Home, FileText, Calendar, CreditCard, Wrench, Bell, MessageSquare, Search, Building2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function TenantSidebar({ user, onNavigate }: { user: any; onNavigate?: () => void }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const mainNavItems = [
    { href: '/tenant', icon: Home, label: 'Dashboard' },
    { href: '/tenant/properties', icon: Building2, label: 'My Properties' },
    { href: '/tenant/profile', icon: FileText, label: 'Profile' },
    { href: '/tenant/payments', icon: CreditCard, label: 'Payments' },
    { href: '/tenant/reservations', icon: Calendar, label: 'Reservations' },
    { href: '/tenant/visits', icon: Calendar, label: 'Visits' },
    { href: '/tenant/documents', icon: FileText, label: 'Documents' },
    { href: '/tenant/maintenance', icon: Wrench, label: 'Maintenance' },
    { href: '/tenant/notices', icon: Bell, label: 'Notices' },
    { href: '/tenant/complaints', icon: MessageSquare, label: 'Complaints' },
  ]

  return (
    <aside className="w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 h-screen flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <Image
          src="/logo.png"
          alt="Leap Logo"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-bold text-2xl tracking-tighter">Leap</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Button 
                key={item.href}
                asChild 
                variant={isActive(item.href) ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3 h-10"
                onClick={onNavigate}
              >
                <Link href={item.href}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
          
          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-border/50" />
          </div>
          
          {/* Find Properties Link */}
          <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10"
            onClick={onNavigate}
          >
            <Link href="/properties">
              <Search className="w-4 h-4" />
              Find Properties
            </Link>
          </Button>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-border/50 px-4 py-4 space-y-2">
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
            {getInitial(user)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'Tenant'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Settings */}
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start gap-3 h-10"
        >
          <Link href="/settings">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </Button>

        {/* Sign Out */}
        <form action="/auth/logout" method="post">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
            type="submit"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
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
