export const metadata = {
  title: 'Privacy Policy - Leap',
  description: 'Comprehensive privacy policy detailing how Leap collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <main className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">
          Effective Date: January 23, 2026 | Last Updated: January 23, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Leap ("we," "us," "our," or "Leap"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our residential property rental platform, including our website, mobile application, and related services (collectively, the "Service").
            </p>
            <p>
              By accessing or using our Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground">2.1 Personal Information You Provide</h3>
            <p>We collect information that you voluntarily provide to us when you:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Register an account:</strong> Name, email address, phone number, password</li>
              <li><strong>Complete your profile:</strong> Date of birth, employment information, income details, emergency contact information</li>
              <li><strong>Apply for a property:</strong> Government-issued ID, proof of income, employment verification, reference information, credit history</li>
              <li><strong>Make payments:</strong> Payment card details (processed through secure third-party payment processors)</li>
              <li><strong>Upload documents:</strong> Rental agreements, identification documents, bank statements, employment letters</li>
              <li><strong>Schedule property visits:</strong> Preferred dates, times, contact preferences</li>
              <li><strong>Submit maintenance requests:</strong> Description of issue, photos, preferred contact method</li>
              <li><strong>Contact support:</strong> Messages, feedback, complaints, inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">2.2 Automatically Collected Information</h3>
            <p>When you access our Service, we automatically collect certain information, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns, search queries</li>
              <li><strong>Location Data:</strong> IP address, approximate geographic location (for property searches and recommendations)</li>
              <li><strong>Cookies and Tracking:</strong> Session data, preferences, authentication tokens (see our Cookie Policy for details)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">2.3 Information from Third Parties</h3>
            <p>We may receive information about you from:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Payment processors:</strong> Transaction status, payment verification</li>
              <li><strong>Identity verification services:</strong> Verification status, fraud detection data</li>
              <li><strong>Credit bureaus:</strong> Credit scores, rental history (with your consent)</li>
              <li><strong>References:</strong> Employment verification, character references</li>
              <li><strong>Social media:</strong> If you choose to connect social accounts</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            
            <h3 className="text-xl font-semibold text-foreground">3.1 Service Delivery</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create and manage your account</li>
              <li>Process rental applications and tenant screening</li>
              <li>Facilitate property bookings and reservations</li>
              <li>Process payments and generate invoices</li>
              <li>Coordinate property visits and viewings</li>
              <li>Manage maintenance requests and complaints</li>
              <li>Enable communication between tenants and property owners/managers</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.2 Service Improvement</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Analyze usage patterns and trends</li>
              <li>Conduct research and analytics</li>
              <li>Develop new features and services</li>
              <li>Improve user experience and interface</li>
              <li>Test and troubleshoot issues</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.3 Communication</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Send transactional notifications (payment confirmations, booking updates)</li>
              <li>Provide customer support</li>
              <li>Send service announcements and updates</li>
              <li>Send marketing communications (with your consent - you can opt out anytime)</li>
              <li>Respond to your inquiries and requests</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.4 Security and Legal Compliance</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Verify identity and prevent fraud</li>
              <li>Detect and prevent security incidents</li>
              <li>Comply with legal obligations</li>
              <li>Enforce our Terms of Service</li>
              <li>Resolve disputes and protect legal rights</li>
            </ul>
          </section>

          {/* How We Share Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. How We Share Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold text-foreground">4.1 With Property Owners and Managers</h3>
            <p>
              When you apply for a property or book a viewing, we share relevant information (name, contact details, application materials) with the property owner or manager to facilitate the rental process.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.2 With Service Providers</h3>
            <p>We share information with trusted third-party service providers who assist us in:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Payment processing (Stripe, PayPal, etc.)</li>
              <li>Cloud hosting and storage (AWS, Supabase)</li>
              <li>Email and SMS communications</li>
              <li>Identity verification and background checks</li>
              <li>Analytics and performance monitoring</li>
              <li>Customer support tools</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.3 For Legal Reasons</h3>
            <p>We may disclose your information if required by law or in response to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Legal processes (subpoenas, court orders)</li>
              <li>Government or regulatory requests</li>
              <li>Investigations into violations of our Terms of Service</li>
              <li>Protection of our rights, property, or safety</li>
              <li>Emergency situations involving danger to persons</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.4 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.5 With Your Consent</h3>
            <p>
              We may share your information for any other purpose with your explicit consent.
            </p>
          </section>

          {/* Data Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection and privacy</li>
              <li>Restricted access to personal information on a need-to-know basis</li>
              <li>Secure backup and disaster recovery procedures</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          {/* Data Retention */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Account information:</strong> Retained while your account is active and for 2 years after closure</li>
              <li><strong>Transaction records:</strong> Retained for 7 years for accounting and tax purposes</li>
              <li><strong>Application materials:</strong> Retained for 1 year after application rejection or 5 years after tenancy ends</li>
              <li><strong>Communications:</strong> Retained for 3 years for support and dispute resolution</li>
              <li><strong>Marketing data:</strong> Deleted immediately upon opt-out request</li>
            </ul>
            <p className="mt-4">
              After the retention period expires, we will securely delete or anonymize your personal information.
            </p>
          </section>

          {/* Your Privacy Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Right to Restriction:</strong> Request limitation of processing in certain circumstances</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time (without affecting prior processing)</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with a data protection authority</li>
            </ul>

            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@leap.ug" className="text-primary hover:underline">privacy@leap.ug</a>. We will respond to your request within 30 days.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activities. This helps us improve functionality, analyze usage, and personalize your experience.
            </p>
            <p>
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our Service. For detailed information, please see our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites, applications, or services that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          {/* International Data Transfers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our Service, you consent to the transfer of your information to these countries. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting a prominent notice on our Service</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Updating the "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="mt-4">
              Your continued use of our Service after the effective date of the updated policy constitutes acceptance of the changes.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg space-y-3 mt-4">
              <p><strong>Leap - Data Protection Officer</strong></p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Email:</span>
                <a href="mailto:privacy@leap.ug" className="text-primary hover:underline">privacy@leap.ug</a>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Phone:</span>
                <a href="tel:+256700000000" className="text-primary hover:underline">+256 700 000 000</a>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Address:</span>
                <span>Kampala, Uganda</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Website:</span>
                <a href="/contact" className="text-primary hover:underline">leap.ug/contact</a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-sm text-muted-foreground pt-8 border-t border-border/50 space-y-2">
            <p><strong>Effective Date:</strong> January 23, 2026</p>
            <p><strong>Last Updated:</strong> January 23, 2026</p>
            <p className="mt-4">
              This Privacy Policy is governed by the laws of Uganda. For any disputes arising from this policy, the courts of Kampala shall have exclusive jurisdiction.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
