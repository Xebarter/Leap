import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

export const metadata = {
  title: 'FAQ - Leap',
  description: 'Frequently asked questions about Leap rental platform.',
}

export default function FAQPage() {
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Get Started" on the homepage, enter your email, and follow the verification steps. You\'ll need to provide basic information and documents.',
        },
        {
          q: 'What documents do I need to provide?',
          a: 'You\'ll typically need a valid ID, proof of income (pay slip or bank statement), and references from previous landlords.',
        },
        {
          q: 'Is there a registration fee?',
          a: 'No, registration is completely free. You only pay when you\'re ready to book a property.',
        },
      ],
    },
    {
      category: 'Finding Properties',
      questions: [
        {
          q: 'How do I search for properties?',
          a: 'Use our search bar to filter by location, price range, number of bedrooms, and amenities. You can save properties to your favorites.',
        },
        {
          q: 'Are all properties verified?',
          a: 'Yes, all properties on Leap are verified and inspected to ensure quality and legitimacy.',
        },
        {
          q: 'Can I view a property before applying?',
          a: 'Yes, you can request a viewing through the property listing. Our team will coordinate with the landlord.',
        },
      ],
    },
    {
      category: 'Application & Payment',
      questions: [
        {
          q: 'How long does the approval process take?',
          a: 'Most applications are approved within 24-48 hours after document submission and verification.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept mobile money (MTN, Airtel), bank transfers, and card payments. All transactions are encrypted and secure.',
        },
        {
          q: 'Is my payment protected?',
          a: 'Yes, your deposit is held in an escrow account until you move in and both parties confirm satisfaction.',
        },
      ],
    },
    {
      category: 'Tenant Rights & Support',
      questions: [
        {
          q: 'What happens if I have a problem with the property?',
          a: 'You can file a maintenance request through your dashboard. Our support team will help coordinate repairs with the landlord.',
        },
        {
          q: 'How do I report a dispute?',
          a: 'Use the dispute resolution feature in your account. Our team will mediate and help find a fair solution.',
        },
        {
          q: 'What if I need to break my lease early?',
          a: 'Contact our support team to discuss your situation. Early termination depends on your lease terms and the landlord\'s agreement.',
        },
      ],
    },
    {
      category: 'Privacy & Security',
      questions: [
        {
          q: 'How do you protect my personal information?',
          a: 'We use industry-standard encryption and security practices. Your data is never shared with third parties without consent.',
        },
        {
          q: 'Is my identity verified before seeing properties?',
          a: 'Yes, we verify all users to ensure safety for both tenants and landlords.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can delete your account anytime from your account settings. All your data will be securely removed.',
        },
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
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Leap
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqs.map((section, sidx) => (
              <div key={sidx} className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">{section.category}</h2>
                <div className="space-y-3">
                  {section.questions.map((item, qidx) => (
                    <Card key={qidx} className="border-none shadow-none bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">{item.q}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still Need Help */}
          <div className="mt-16 bg-primary/5 border border-primary/20 rounded-xl p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Didn't find what you're looking for?</h3>
            <p className="text-muted-foreground">Our support team is here to help</p>
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
