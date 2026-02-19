'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings, LogOut, Home, FileText, Calendar, CreditCard, Wrench, Bell, MessageSquare, Search, Building2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function TenantSidebar({ user, onNavigate }: { user: any; onNavigate?: () => void }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <aside className="w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 h-screen flex flex-col p-6 lg:p-8">
      <div className="flex items-center gap-3 px-2 mb-12">
        <Image
          src="/logo.png"
          alt="Leap Logo"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-bold text-2xl tracking-tighter">Leap</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <Button 
          asChild 
          variant={isActive('/tenant') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/properties') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/properties">
            <Building2 className="w-4 h-4" />
            My Properties
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/profile') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/profile">
            <FileText className="w-4 h-4" />
            Profile
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/payments') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/payments">
            <CreditCard className="w-4 h-4" />
            Payments
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/reservations') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/reservations">
            <Calendar className="w-4 h-4" />
            My Reservations
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/visits') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/visits">
            <Calendar className="w-4 h-4" />
            My Visits
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/documents') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/documents">
            <FileText className="w-4 h-4" />
            Documents
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/maintenance') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/maintenance">
            <Wrench className="w-4 h-4" />
            Maintenance
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/notices') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/notices">
            <Bell className="w-4 h-4" />
            Notices
          </Link>
        </Button>
        <Button 
          asChild 
          variant={isActive('/tenant/complaints') ? 'secondary' : 'ghost'} 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/tenant/complaints">
            <MessageSquare className="w-4 h-4" />
            Complaints
          </Link>
        </Button>
        <Button 
          asChild 
          variant="ghost" 
          className="w-full justify-start gap-3"
          onClick={onNavigate}
        >
          <Link href="/properties">
            <Search className="w-4 h-4" />
            Find Properties
          </Link>
        </Button>
      </nav>

      <div className="space-y-6 pt-6 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl text-base font-medium transition-all text-muted-foreground hover:bg-muted/50"
        >
          <Link href="/settings">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </Button>

        <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
            {getInitial(user)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.user_metadata?.full_name || 'Tenant'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <form action="/auth/logout" method="post">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            type="submit"
          >
            <LogOut className="w-5 h-5" />
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
