import React from 'react'
import Link from 'next/link'
import { ArrowRight, Search, Star, Shield, CheckCircle2, Clock, Users, Home, FileText, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropertyCard } from '@/components/publicView/property-card'
import { FeaturedPropertyCard } from '@/components/publicView/featured-property-card'
import { HeroSearchBar } from '@/components/publicView/hero-search-bar'
import { getPublicProperties, getFeaturedProperties } from '@/lib/properties'

export default async function HomePage() {
  // Fetch properties from database - pass full property data to PropertyCard
  let properties = []
  let featuredProperties = []
  try {
    // Fetch both featured and all properties in parallel
    const [allProps, featured] = await Promise.all([
      getPublicProperties(),
      getFeaturedProperties(6)
    ])
    properties = allProps
    featuredProperties = featured
  } catch (err) {
    console.error('Failed to fetch properties in HomePage:', err)
    // Return empty array - page will still render
    properties = []
    featuredProperties = []
  }

  return (
    <main className="bg-background">
      {/* Hero Section - Ultra Compact */}
      <section className="relative py-4 sm:py-6 bg-gradient-to-br from-primary/15 via-background to-background overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-6">
            {/* Compact Header */}
            <div className="space-y-2">
              <div className="inline-block">
                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  Trusted by 50,000+ Renters
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
                Find Your Perfect <span className="text-primary">Home</span> <span className="text-xl sm:text-3xl text-muted-foreground">in Uganda</span>
              </h1>
            </div>

            {/* Advanced Search Bar with Filters */}
            <HeroSearchBar showSearchButton={true} />
            
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-muted-foreground">
                <Link href="/properties" className="text-primary hover:underline font-medium">Advanced filters</Link>
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  500+ Properties
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  98% Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section - PREMIUM SHOWCASE */}
      {featuredProperties.length > 0 ? (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/30 via-white to-background relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-2 rounded-full mb-4 border border-amber-200/50">
                <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Premium Selection</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-amber-900 via-slate-900 to-slate-800 bg-clip-text text-transparent">
                Featured Luxury Properties
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Handpicked premium properties offering exceptional quality and value
              </p>
            </div>

            {/* Featured Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
              {featuredProperties.map((property: any) => (
                <FeaturedPropertyCard key={property.id} property={property} />
              ))}
            </div>
            
            {/* View All Properties Button */}
            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="gap-2 px-8 h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg hover:shadow-xl transition-all">
                <Link href="/properties">
                  Explore All Properties
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-8 sm:py-10 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="space-y-3">
                <Home className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">No Featured Properties Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Check back soon for amazing properties</p>
                </div>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/properties">
                    Browse All Properties
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section - Condensed */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Finding and securing your dream rental in 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                  <Search className="w-7 h-7 text-primary" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Browse Properties</h3>
                <p className="text-sm text-muted-foreground">
                  Search and filter through hundreds of verified properties
                </p>
              </div>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                  <Clock className="w-7 h-7 text-primary" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Schedule a Visit</h3>
                <p className="text-sm text-muted-foreground">
                  Book a viewing and explore the property in person
                </p>
              </div>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                  <Key className="w-7 h-7 text-primary" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-semibold">Apply & Move In</h3>
                <p className="text-sm text-muted-foreground">
                  Submit your application and get the keys to your new home
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Condensed */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Why Choose Leap?</h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              We make renting simple, secure, and transparent
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Benefit 1 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Verified Properties</h3>
              <p className="text-xs text-muted-foreground">
                Quality assured
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Easy Application</h3>
              <p className="text-xs text-muted-foreground">
                Apply in minutes
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Dedicated Support</h3>
              <p className="text-xs text-muted-foreground">
                Always here to help
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Transparent Process</h3>
              <p className="text-xs text-muted-foreground">
                No hidden fees
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Wide Selection</h3>
              <p className="text-xs text-muted-foreground">
                Perfect for you
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">Fast Response</h3>
              <p className="text-xs text-muted-foreground">
                Quick processing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 bg-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 sm:p-12 text-center shadow-2xl border border-primary/20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-primary-foreground">
                <Star className="w-4 h-4 fill-current" />
                Join 50,000+ Happy Renters
              </div>
              
              <h2 className="text-3xl sm:text-5xl font-bold text-primary-foreground tracking-tight">
                Ready to Find Your New Home?
              </h2>
              
              <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Create your free account today and start browsing verified properties, schedule visits, and apply online—all in one place
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" variant="secondary" className="gap-2 text-base h-14 px-8 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/auth/sign-up">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 text-base h-14 px-8 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                  <Link href="/properties">
                    Browse Properties
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 max-w-xl mx-auto border-t border-primary-foreground/20">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-foreground">500+</p>
                  <p className="text-xs text-primary-foreground/80 mt-1">Properties</p>
                </div>
                <div className="text-center border-x border-primary-foreground/20">
                  <p className="text-2xl font-bold text-primary-foreground">50K+</p>
                  <p className="text-xs text-primary-foreground/80 mt-1">Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-foreground">98%</p>
                  <p className="text-xs text-primary-foreground/80 mt-1">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
