"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Settings, LogOut, LayoutDashboard, Building2, Users, CalendarCheck, CreditCard, Wrench, Shield, Home } from "lucide-react"

export function AdminMobileHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Properties", href: "/admin/properties", icon: Building2 },
    { label: "Buildings", href: "/admin/buildings", icon: Building2 },
    { label: "Landlords", href: "/admin/landlords", icon: Users },
    { label: "Tenants", href: "/admin/tenants", icon: Users },
    { label: "Reservations", href: "/admin/reservations", icon: Shield },
    { label: "Occupancies", href: "/admin/occupancies", icon: Home },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  ]

  return (
    <header className="md:hidden border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Leap Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-2xl tracking-tighter hidden sm:inline">Leap</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <form action="/auth/logout" method="post" className="hidden xs:block">
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="w-5 h-5" />
              </Button>
            </form>
            <button
              className="p-2 rounded-lg hover:bg-muted/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="pb-4 space-y-1">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" className="w-full justify-start text-sm">
                <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <span className="inline-flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
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
  )
}
