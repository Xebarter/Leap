'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  User as UserIcon,
  Building2,
  Home,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  user_type: string | null
  is_admin: boolean
}

export function ProfileMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const fetchUserAndProfile = async () => {
      try {
        // Get authenticated user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        
        setUser(currentUser)

        if (currentUser) {
          // Fetch profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          setProfile(profileData)
        }
      } catch (error) {
        console.error('Error fetching user/profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProfile()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      } else {
        fetchUserAndProfile()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.charAt(0).toUpperCase()
  }

  const getDashboardLink = () => {
    if (!profile) return '/tenant'
    
    if (profile.is_admin) return '/admin'
    if (profile.role === 'landlord' || profile.user_type === 'landlord') return '/landlord'
    return '/tenant'
  }

  const getRoleLabel = () => {
    if (!profile) return 'User'
    
    if (profile.is_admin) return 'Admin'
    if (profile.role === 'landlord' || profile.user_type === 'landlord') return 'Landlord'
    return 'Tenant'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  // Authenticated user
  if (user && profile) {
    return (
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
          >
            <Avatar className="h-10 w-10 border-2 border-background shadow-md">
              <AvatarImage
                src={profile.avatar_url || undefined}
                alt={profile.full_name || profile.email}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
              <p className="text-xs leading-none text-primary font-medium mt-1">
                {getRoleLabel()}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={getDashboardLink()} className="cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/tenant/profile" className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {(profile.is_admin || profile.role === 'landlord' || profile.user_type === 'landlord') && (
            <DropdownMenuItem asChild>
              <Link 
                href={profile.is_admin ? '/admin' : '/landlord/settings'} 
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Not authenticated - show sign-in options
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 hover:bg-primary/5">
          <UserCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Sign In</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Sign in as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link 
            href="/auth/login?type=tenant" 
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            <Home className="mr-2 h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="font-medium">Tenant</span>
              <span className="text-xs text-muted-foreground">
                Find and rent properties
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link 
            href="/auth/login?type=landlord" 
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            <Building2 className="mr-2 h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span className="font-medium">Landlord</span>
              <span className="text-xs text-muted-foreground">
                Manage your properties
              </span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link 
            href="/auth/sign-up" 
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span className="font-medium">Create Account</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
