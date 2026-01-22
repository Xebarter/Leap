import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Shield,
  Lock,
  TrendingUp,
  Clock,
  Users,
  Zap,
  MapPin,
  BarChart3,
} from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Verified Properties',
      description: 'All properties are verified and inspected to ensure they meet quality standards.',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'Your payments are protected with secure, encrypted transactions and escrow services.',
    },
    {
      icon: Clock,
      title: 'Quick Process',
      description: 'Complete your rental process in minutes with our streamlined application system.',
    },
    {
      icon: TrendingUp,
      title: 'Transparent Pricing',
      description: 'No hidden fees. See exactly what you\'re paying with complete price breakdown.',
    },
    {
      icon: Users,
      title: 'Community Support',
      description: '24/7 customer support team ready to help with any questions or issues.',
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Real-time updates on your rental status, payments, and important announcements.',
    },
    {
      icon: MapPin,
      title: 'Prime Locations',
      description: 'Find properties in the most desirable neighborhoods across Uganda.',
    },
    {
      icon: BarChart3,
      title: 'Performance Insights',
      description: 'Track your rental history, payments, and property performance metrics.',
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Why Choose Leap?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We\'ve built a platform that prioritizes your security, convenience, and peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card key={idx} className="border-none shadow-none bg-background hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
