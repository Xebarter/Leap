'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: 'About Us', href: '/about' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Contact', href: '/contact' },
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

            {/* Auth Buttons & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">
                    Get Started
                  </Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen && mounted ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mounted && mobileMenuOpen && (
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
                  <Link href="/auth/login">
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start text-sm">
                  <Link href="/auth/sign-up">
                    Get Started
                  </Link>
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  )
}
