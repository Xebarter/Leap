"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  ExternalLink,
  LogOut,
  ChevronRight,
  CreditCard,
  Wrench,
  Shield,
  Home
} from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      exact: true
    },
    {
      href: "/admin/properties",
      label: "Properties",
      icon: Building2
    },
    {
      href: "/admin/buildings",
      label: "Buildings",
      icon: Building2
    },
    {
      href: "/admin/landlords",
      label: "Landlords",
      icon: Users
    },
    {
      href: "/admin/tenants",
      label: "Tenants",
      icon: Users
    },
    {
      href: "/admin/reservations",
      label: "Reservations",
      icon: Shield
    },
    {
      href: "/admin/occupancies",
      label: "Occupancies",
      icon: Home
    },
    {
      href: "/admin/bookings",
      label: "Bookings",
      icon: CalendarCheck
    },
    {
      href: "/admin/payments",
      label: "Payments",
      icon: CreditCard
    },
    {
      href: "/admin/maintenance",
      label: "Maintenance",
      icon: Wrench
    },
  ]

  const renderNavItem = (item: typeof navItems[0]) => {
    // Logic for active state: exact match for overview, startsWith for others
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href)

    return (
      <Button
        key={item.href}
        asChild
        variant="ghost"
        className={cn(
          "w-full justify-between group transition-all duration-200 mb-1",
          "hover:bg-primary/10 hover:text-primary",
          isActive
            ? "bg-primary/10 text-primary font-semibold shadow-sm"
            : "text-muted-foreground"
        )}
      >
        <Link href={item.href}>
          <div className="flex items-center gap-3">
            <item.icon className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
            )} />
            <span>{item.label}</span>
          </div>
          {isActive && <ChevronRight className="h-3 w-3" />}
        </Link>
      </Button>
    )
  }

  return (
    <aside
      className="
        sticky top-0
        h-screen w-64
        border-r border-border/50
        bg-card/30 backdrop-blur-xl
        flex flex-col
        transition-all
      "
    >
      {/* Brand / Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Leap Logo"
            width={40}
            height={40}
            className="h-8 w-auto"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Leap<span className="text-primary text-sm font-medium ml-1">Admin</span>
          </span>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Navigation */}
        <div className="px-4 mb-4 mt-6">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-2 mb-4 opacity-60">
            Management
          </p>
          <nav className="space-y-1">
            {navItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Secondary / External Navigation */}
        <div className="px-4 mt-4 pb-4">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-2 mb-4 opacity-60">
            Public
          </p>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link href="/">
              <ExternalLink className="h-4 w-4" />
              View Live Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer / User Actions */}
      <div className="p-4 border-t border-border/50 bg-background/20 flex-shrink-0">
        <form action="/auth/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="
              w-full justify-start gap-3
              text-muted-foreground
              hover:text-destructive
              hover:bg-destructive/10
              transition-all
            "
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </form>
      </div>
    </aside>
  )
}