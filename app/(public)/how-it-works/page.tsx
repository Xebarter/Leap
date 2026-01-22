import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Search, FileCheck, CreditCard, KeyRound } from 'lucide-react'

export const metadata = {
  title: 'How It Works - Leap',
  description: 'Learn how to find and rent your perfect home on Leap.',
}

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      number: '1',
      title: 'Search & Explore',
      description: 'Browse our verified listings and filter by location, price, amenities, and more. Save your favorite properties.',
    },
    {
      icon: FileCheck,
      number: '2',
      title: 'Apply & Verify',
      description: 'Submit your application with your documents and personal information. We verify your details securely.',
    },
    {
      icon: CreditCard,
      number: '3',
      title: 'Secure Payment',
      description: 'Make your payment safely through our secure gateway. Your deposit is protected in escrow.',
    },
    {
      icon: KeyRound,
      number: '4',
      title: 'Move In',
      description: 'Get your keys and move in! We\'ll be here to support you every step of the way.',
    },
  ]

  const features = [
    {
      title: 'Property Verification',
      points: [
        'Physical inspection of all properties',
        'Document verification',
        'Landlord background check',
        'Quality assurance',
      ],
    },
    {
      title: 'Tenant Protection',
      points: [
        'Escrow payment protection',
        'Dispute resolution',
        'Secure communication',
        'Rights advocacy',
      ],
    },
    {
      title: 'Payment Security',
      points: [
        'Encrypted transactions',
        'Multiple payment options',
        'Receipt generation',
        'Fraud prevention',
      ],
    },
    {
      title: 'Ongoing Support',
      points: [
        '24/7 customer support',
        'Maintenance request system',
        'Payment tracking',
        'Community forum',
      ],
    },
  ]

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              How It Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Finding your perfect home is easy. Follow these simple steps.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isEven = idx % 2 === 0

              return (
                <div key={idx} className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Content */}
                  <div className={`flex-1 space-y-4 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Step {step.number}</p>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Divider */}
                  {idx < steps.length - 1 && (
                    <div className={`hidden lg:block w-1 h-20 bg-gradient-to-b from-primary/50 to-primary/10 ${isEven ? 'lg:order-2' : 'lg:order-1'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">What Makes Us Different</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We go above and beyond to ensure a safe and transparent rental experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none shadow-none bg-background">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.points.map((point, pidx) => (
                      <li key={pidx} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is my personal information safe?',
                a: 'Yes, we use industry-standard encryption and security practices to protect all your data.',
              },
              {
                q: 'What documents do I need?',
                a: 'You\'ll typically need a valid ID, proof of income, and sometimes references from previous landlords.',
              },
              {
                q: 'How long does the process take?',
                a: 'Most applications are processed within 24-48 hours once all documents are submitted.',
              },
              {
                q: 'Can I get a refund?',
                a: 'Our refund policy depends on the landlord\'s terms. We recommend reviewing the lease carefully before signing.',
              },
            ].map((faq, idx) => (
              <Card key={idx} className="border-none shadow-none bg-muted/50">
                <CardContent className="pt-6">
                  <p className="font-semibold mb-2">{faq.q}</p>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Need more information?</p>
            <Button asChild variant="outline">
              <Link href="/faq">
                View Full FAQ
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground">
            Browse our properties and find your perfect home today
          </p>
          <Button asChild size="lg">
            <Link href="/properties">
              Browse Properties
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
