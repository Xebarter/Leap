import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Search, FileCheck, CreditCard, KeyRound, Target, Award, CheckCircle2, Shield } from 'lucide-react'

export const metadata = {
  title: 'How It Works - Leap',
  description: 'Discover how Leap makes finding and renting your perfect home simple, secure, and transparent.',
}

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      number: '1',
      title: 'Search & Explore',
      description: 'Browse our verified listings and filter by location, price, amenities, and more. Save your favorite properties and schedule visits at your convenience.',
      details: [
        'Advanced search filters',
        'Interactive property maps',
        'Virtual tours and high-quality photos',
        'Instant property details and availability',
      ],
    },
    {
      icon: FileCheck,
      number: '2',
      title: 'Apply & Verify',
      description: 'Submit your application with your documents and personal information. We verify your details securely and landlords review your profile.',
      details: [
        'Simple online application process',
        'Secure document upload',
        'Identity and income verification',
        'Fast 24-48 hour processing',
      ],
    },
    {
      icon: CreditCard,
      number: '3',
      title: 'Secure Payment',
      description: 'Make your payment safely through our encrypted payment gateway. Your deposit is protected in escrow until move-in is confirmed.',
      details: [
        'Multiple payment options',
        'Bank-grade encryption',
        'Escrow protection',
        'Automatic receipt generation',
      ],
    },
    {
      icon: KeyRound,
      number: '4',
      title: 'Move In & Manage',
      description: 'Get your keys and move into your new home! Use our platform to manage rent payments, submit maintenance requests, and communicate with your landlord.',
      details: [
        'Digital key handover coordination',
        'Online rent payment tracking',
        'Maintenance request system',
        '24/7 ongoing support',
      ],
    },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Property Verification',
      description: 'Every property is physically inspected and verified before listing.',
      points: [
        'Physical property inspection',
        'Ownership document verification',
        'Landlord background checks',
        'Quality assurance standards',
      ],
    },
    {
      icon: CheckCircle2,
      title: 'Tenant Protection',
      description: 'Your rights and security are our top priority throughout the rental process.',
      points: [
        'Escrow payment protection',
        'Dispute resolution support',
        'Secure encrypted communication',
        'Rights advocacy and guidance',
      ],
    },
    {
      icon: CreditCard,
      title: 'Payment Security',
      description: 'Bank-grade security for all transactions with complete transparency.',
      points: [
        'End-to-end encryption',
        'Mobile money & card options',
        'Instant digital receipts',
        'Advanced fraud prevention',
      ],
    },
    {
      icon: Target,
      title: 'Ongoing Support',
      description: 'We don\'t disappear after you move in - we\'re here for the entire journey.',
      points: [
        '24/7 customer support',
        'Maintenance tracking system',
        'Payment reminders & history',
        'Community resources & tips',
      ],
    },
  ]

  const principles = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To simplify residential property rental and create trust between landlords and tenants through technology.',
    },
    {
      icon: Award,
      title: 'Our Vision',
      description: 'To be the leading property rental platform trusted by millions across Africa, making home rental stress-free.',
    },
    {
      icon: CheckCircle2,
      title: 'Our Commitment',
      description: 'Transparency, security, and customer-centric service in every interaction - ensuring a safe rental experience.',
    },
  ]

  const stats = [
    { value: '1,000+', label: 'Verified Properties' },
    { value: '5,000+', label: 'Happy Tenants' },
    { value: '24/7', label: 'Support Available' },
    { value: '99.9%', label: 'Uptime Guarantee' },
  ]

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              How Leap Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're revolutionizing how people find and rent homes in Uganda through technology, trust, and transparency. Finding your perfect home has never been easier.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg">
                <Link href="/properties">
                  Browse Properties
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  Get in Touch
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Your Journey to a New Home</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these four simple steps to find and secure your perfect rental property
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isEven = idx % 2 === 0

              return (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Visual Element */}
                  <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'} relative`}>
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-12 border border-primary/10">
                      <div className="flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon className="w-16 h-16 text-primary" />
                        </div>
                      </div>
                      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'} space-y-6`}>
                    <div>
                      <p className="text-sm font-medium text-primary mb-2">Step {step.number}</p>
                      <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                      <p className="text-lg text-muted-foreground">{step.description}</p>
                    </div>

                    <Card className="border-primary/20 bg-muted/30">
                      <CardContent className="pt-6">
                        <ul className="space-y-3">
                          {step.details.map((detail, didx) => (
                            <li key={didx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features - What Makes Us Different */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">What Makes Leap Different</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We go above and beyond to ensure a safe, secure, and transparent rental experience at every step
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="border-none shadow-lg bg-background">
                  <CardHeader>
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feature.points.map((point, pidx) => (
                        <li key={pidx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Principles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Built on Trust & Transparency</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core principles drive everything we do and guide our product development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {principles.map((principle, idx) => {
              const Icon = principle.icon
              return (
                <Card key={idx} className="border-none shadow-none bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Common Questions</h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to questions you may have
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is my personal information safe?',
                a: 'Absolutely. We use industry-standard encryption and security practices to protect all your data. Your information is never shared without your consent.',
              },
              {
                q: 'What documents do I need to apply?',
                a: 'You\'ll typically need a valid government ID, proof of income (payslip or bank statement), and sometimes references from previous landlords or employers.',
              },
              {
                q: 'How long does the application process take?',
                a: 'Most applications are reviewed and processed within 24-48 hours once all required documents are submitted and verified.',
              },
              {
                q: 'How does the escrow payment protection work?',
                a: 'Your deposit is held securely in escrow until you confirm successful move-in and key handover, ensuring both tenant and landlord protection.',
              },
              {
                q: 'What if I have issues with my rental property?',
                a: 'Use our maintenance request system to report issues. We facilitate communication between you and your landlord and help resolve disputes fairly.',
              },
              {
                q: 'Can I cancel my application or get a refund?',
                a: 'Refund policies depend on the landlord\'s terms and the stage of the application. We recommend reviewing all terms carefully before submitting payment.',
              },
            ].map((faq, idx) => (
              <Card key={idx} className="border-none shadow-sm bg-background hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <p className="font-semibold mb-2 text-foreground">{faq.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/faq">
                  View Full FAQ
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">Ready to Find Your Perfect Home?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of happy tenants who found their ideal rental property through Leap
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/properties">
                Browse Properties
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/sign-up">
                Create Free Account
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
