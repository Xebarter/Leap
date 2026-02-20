"use client"

import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import Image from "next/image"

interface LandlordHeaderProps {
  user: any
  landlordProfile: any
  displayName: string
}

export default function LandlordHeader({ user, landlordProfile, displayName }: LandlordHeaderProps) {
  const initials = (displayName || "L")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "L"

  return (
    <header className="hidden lg:block border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/landlord" className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Leap Logo" width={40} height={40} className="h-10 w-auto" />
            <span className="font-bold text-2xl tracking-tighter">Leap</span>
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">Welcome back, {displayName}!</h2>
            <p className="text-sm text-muted-foreground">Manage your properties, tenants, payments, and issues</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/landlord/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/auth/logout" className="text-red-600">
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="hidden sm:block border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {initials.charAt(0) || 'L'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
