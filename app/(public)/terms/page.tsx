export const metadata = {
  title: 'Terms of Service - Leap',
  description: 'Leap terms of service and conditions of use.',
}

export default function TermsPage() {
  return (
    <main className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-12">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
            <p>
              By accessing and using this website and mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. User Representations</h2>
            <p>By using the Site, you represent and warrant that:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>All registration information you submit is true and accurate</li>
              <li>You will maintain the accuracy of such information</li>
              <li>You have the legal capacity and authority to enter into this Agreement</li>
              <li>You will not use the Site for any illegal or unauthorized purpose</li>
              <li>Your use will not violate any applicable law or regulation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. User Rights and Restrictions</h2>
            <p>
              Subject to the terms and conditions of this Agreement, we grant you a limited, non-exclusive, non-transferable license to access and use the Site. You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Systematically retrieve data or information from the Site</li>
              <li>Create derivative works from the Site</li>
              <li>Reverse engineer or circumvent security or technological limitations</li>
              <li>Disrupt the normal flow of dialogue within the Site</li>
              <li>Attempt to gain unauthorized access to the Site</li>
              <li>Use the Site for commercial purposes without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Disclaimer of Warranties</h2>
            <p>
              The Site is provided on an "AS-IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the Site. To the fullest extent permissible pursuant to applicable law, we disclaim all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Limitation of Liability</h2>
            <p>
              In no event shall Leap, nor its directors, employees, or agents, be liable to you for any damages, including data loss, lost profits, or any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the materials on the Site or the Site itself.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Modifications to Terms</h2>
            <p>
              We reserve the right, in our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Governing Law</h2>
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws of Uganda, and you irrevocably submit to the exclusive jurisdiction of the courts in Kampala.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="space-y-1">
              <li>Email: legal@leap.ug</li>
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
