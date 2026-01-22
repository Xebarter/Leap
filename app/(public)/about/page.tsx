import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle2, Award, Target, Users } from 'lucide-react'

export const metadata = {
  title: 'About Us - Leap',
  description: 'Learn about Leap\'s mission to revolutionize residential property rental in Uganda.',
}

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To simplify residential property rental and create trust between landlords and tenants.',
    },
    {
      icon: Award,
      title: 'Our Vision',
      description: 'To be the leading property rental platform trusted by millions across Africa.',
    },
    {
      icon: Users,
      title: 'Our Values',
      description: 'Transparency, security, and customer-centric service in everything we do.',
    },
    {
      icon: CheckCircle2,
      title: 'Our Commitment',
      description: 'Ensuring every user has a safe, secure, and transparent rental experience.',
    },
  ]

  const team = [
    {
      name: 'John Doe',
      role: 'Founder & CEO',
      expertise: 'Real Estate & Technology',
    },
    {
      name: 'Jane Smith',
      role: 'Chief Technology Officer',
      expertise: 'Software Engineering',
    },
    {
      name: 'Peter Mwami',
      role: 'Head of Operations',
      expertise: 'Operations & Finance',
    },
    {
      name: 'Sarah Kamya',
      role: 'Customer Success Lead',
      expertise: 'Customer Service',
    },
  ]

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              About Leap
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're revolutionizing how people find and rent homes in Uganda through technology and trust.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tight">Our Story</h2>
              <p className="text-lg text-muted-foreground">
                Leap was founded with a simple belief: finding a home shouldn't be complicated or risky. We saw too many people struggling with unclear rental processes, hidden fees, and trust issues.
              </p>
              <p className="text-lg text-muted-foreground">
                Today, we've created a platform that makes renting simple, secure, and transparent. We're proud to serve thousands of happy tenants and landlords.
              </p>
              <p className="text-lg text-muted-foreground">
                Our goal is to become the most trusted platform for residential property rental across Africa.
              </p>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20" />
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-primary/30 rounded-full mx-auto mb-6" />
                  <p className="text-sm text-muted-foreground">Trusted Since 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <Card key={idx} className="border-none shadow-none bg-background">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet the people making Leap possible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <Card key={idx} className="border-none shadow-none bg-muted/30">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4" />
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-primary font-medium mt-1">{member.role}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{member.expertise}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">Join Our Community</h2>
          <p className="text-xl text-muted-foreground">
            Be part of the revolution in residential property rental
          </p>
          <Button asChild size="lg">
            <Link href="/properties">
              Start Exploring
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
