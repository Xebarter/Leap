'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, Home, Building2, HelpCircle, Mail } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Properties', href: '/properties', icon: Building2 },
    { label: 'How It Works', href: '/how-it-works', icon: HelpCircle },
    { label: 'Contact', href: '/contact', icon: Mail },
  ]

  return (
    <>
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
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

            {/* Profile Menu & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <ProfileMenu />
                <Button asChild size="sm" className="ml-2">
                  <Link href="/auth/sign-up">
                    Get Started
                  </Link>
                </Button>
              </div>

              {/* Mobile: Profile Menu */}
              <div className="sm:hidden">
                <ProfileMenu />
              </div>

              {/* Mobile Menu Button */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors" aria-label="Toggle navigation menu">
                  {mounted && open ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                  <span className="sr-only">Toggle menu</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 sm:w-80">
                  <SheetHeader className="border-b border-border/50 pb-6">
                    <SheetTitle className="flex items-center gap-3">
                      <Image
                        src="/logo.png"
                        alt="Leap Logo"
                        width={40}
                        height={40}
                        className="h-10 w-auto"
                      />
                      <span className="font-bold text-2xl tracking-tighter">Leap</span>
                    </SheetTitle>
                  </SheetHeader>

                  {/* Mobile Navigation */}
                  <nav className="mt-6 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Button 
                          key={item.href} 
                          asChild 
                          variant="ghost" 
                          className="w-full justify-start gap-3 h-10" 
                          onClick={() => setOpen(false)}
                        >
                          <Link href={item.href}>
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        </Button>
                      )
                    })}
                    
                    <div className="pt-4 border-t border-border/50 mt-4">
                      <Button asChild className="w-full justify-start gap-3" onClick={() => setOpen(false)}>
                        <Link href="/auth/sign-up">
                          Get Started
                        </Link>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
