export const metadata = {
  title: 'Privacy Policy - Leap',
  description: 'Leap privacy policy and data protection.',
}

export default function PrivacyPage() {
  return (
    <main className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-12">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              Leap ("we," "us," or "our") operates the website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and improve our Service.</p>
            <h3 className="text-xl font-semibold text-foreground">Types of Data Collected:</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Personal Information (name, email, phone number, address)</li>
              <li>Payment Information (processed securely through third-party providers)</li>
              <li>Usage Data (pages visited, time spent, click patterns)</li>
              <li>Device Information (browser type, IP address, operating system)</li>
              <li>Identity Documents (for verification purposes only)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Use of Data</h2>
            <p>Leap uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Security of Data</h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="space-y-1">
              <li>Email: privacy@leap.ug</li>
              <li>Phone: +256 700 000 000</li>
            </ul>
          </section>

          <div className="text-sm text-muted-foreground pt-8 border-t border-border/50">
            Last updated: January 2024
          </div>
        </div>
      </div>
    </main>
  )
}
