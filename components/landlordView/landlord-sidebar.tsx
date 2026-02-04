"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  FileText,
  Key
} from "lucide-react"

import { Button } from '@/components/ui/button'

interface LandlordSidebarProps {
  landlordProfile: any
  onNavigate?: () => void
}

export default function LandlordSidebar({ landlordProfile, onNavigate }: LandlordSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/landlord",
      icon: Home,
    },
    {
      title: "Properties",
      href: "/landlord/properties",
      icon: Building2,
    },
    {
      title: "Occupancies",
      href: "/landlord/occupancies",
      icon: Key,
    },
    {
      title: "Tenants",
      href: "/landlord/tenants",
      icon: Users,
    },
    {
      title: "Payments",
      href: "/landlord/payments",
      icon: DollarSign,
    },
    {
      title: "Reports",
      href: "/landlord/reports",
      icon: BarChart3,
    },
    {
      title: "Maintenance",
      href: "/landlord/maintenance",
      icon: FileText,
    },
    {
      title: "Settings",
      href: "/landlord/settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-72 border-r border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 h-screen flex flex-col p-6 lg:p-8">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-background rounded-full" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-2xl tracking-tighter">Leap</div>
          <div className="text-xs text-muted-foreground truncate">Landlord Portal</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={onNavigate}
            >
              <Link href={item.href}>
                <Icon className="w-4 h-4" />
                {item.title}
              </Link>
            </Button>
          )
        })}

        <div className="my-4 pt-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-3 uppercase tracking-wide">Account</p>
          <div className="space-y-1">
            <Button asChild variant="ghost" className="w-full justify-start gap-3 h-10 text-sm" onClick={onNavigate}>
              <Link href="/landlord/settings">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="space-y-6 pt-6 border-t border-border/50">
        <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
            {getInitial(landlordProfile)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{landlordProfile?.full_name || 'Landlord'}</p>
            <p className="text-xs text-muted-foreground truncate">{landlordProfile?.phone_number || ''}</p>
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

function getInitial(landlordProfile: any): string {
  if (landlordProfile?.full_name) return landlordProfile.full_name.charAt(0).toUpperCase()
  return 'L'
}
