import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Ready to Find Your Home?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy tenants who have found their perfect home on Leap. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link href="/auth/sign-up">
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/properties">
                Browse Properties
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            No credit card required. Takes less than 2 minutes to sign up.
          </p>
        </div>
      </div>
    </section>
  )
}
