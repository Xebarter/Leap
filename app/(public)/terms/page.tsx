export const metadata = {
  title: 'Terms of Service - Leap',
  description: 'Comprehensive terms of service for using the Leap residential property rental platform.',
}

export default function TermsPage() {
  return (
    <main className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">
          Effective Date: January 23, 2026 | Last Updated: January 23, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
            <p>
              Welcome to Leap ("Company," "we," "our," "us"). These Terms of Service ("Terms") govern your access to and use of our residential property rental platform, including our website, mobile application, and related services (collectively, the "Service").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of these Terms, you may not access or use the Service.
            </p>
            <p>
              <strong>IMPORTANT:</strong> These Terms contain provisions that limit our liability to you and require you to resolve disputes with us through binding arbitration on an individual basis, not through class actions.
            </p>
          </section>

          {/* Definitions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>"Tenant"</strong> or <strong>"Renter"</strong> refers to users seeking to rent residential properties.</li>
              <li><strong>"Landlord"</strong> or <strong>"Property Owner"</strong> refers to users listing properties for rent.</li>
              <li><strong>"Property Manager"</strong> refers to authorized agents managing properties on behalf of owners.</li>
              <li><strong>"Listing"</strong> refers to property advertisements posted on our platform.</li>
              <li><strong>"Application"</strong> refers to rental application submissions through our platform.</li>
              <li><strong>"Booking"</strong> or <strong>"Reservation"</strong> refers to confirmed rental agreements facilitated through our Service.</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Eligibility</h2>
            <p>To use our Service, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Service under applicable laws</li>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain and promptly update your account information</li>
            </ul>
            <p className="mt-4">
              We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
            </p>
          </section>

          {/* Account Registration */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Account Registration and Security</h2>
            
            <h3 className="text-xl font-semibold text-foreground">4.1 Account Creation</h3>
            <p>
              When creating an account, you must provide accurate and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.2 Account Security</h3>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use a strong, unique password</li>
              <li>Not share your account credentials with others</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities conducted through your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.3 Account Verification</h3>
            <p>
              We may require identity verification through government-issued IDs, phone number verification, email confirmation, or third-party verification services. Failure to complete verification may limit your access to certain features.
            </p>
          </section>

          {/* User Conduct */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. User Conduct and Prohibited Activities</h2>
            <p>You agree not to:</p>
            
            <h3 className="text-xl font-semibold text-foreground">5.1 Prohibited Uses</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Impersonate any person or entity</li>
              <li>Engage in harassment, abuse, or discriminatory behavior</li>
              <li>Post or transmit harmful content (malware, viruses, spam)</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Collect user information without consent</li>
              <li>Circumvent security features or access controls</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">5.2 Fair Housing Compliance</h3>
            <p>
              All users must comply with fair housing laws. Discrimination based on race, color, religion, sex, familial status, national origin, disability, or other protected characteristics is strictly prohibited.
            </p>
          </section>

          {/* Property Listings */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Property Listings (For Landlords)</h2>
            
            <h3 className="text-xl font-semibold text-foreground">6.1 Listing Accuracy</h3>
            <p>Property owners and managers represent and warrant that all listing information is:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Accurate, current, and complete</li>
              <li>Not misleading or deceptive</li>
              <li>Compliant with all applicable laws and regulations</li>
              <li>Based on properties you have legal authority to rent</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.2 Listing Content</h3>
            <p>You are solely responsible for listing content, including descriptions, photos, pricing, and availability. You grant Leap a non-exclusive, worldwide, royalty-free license to use, display, and distribute your listing content.</p>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.3 Listing Removal</h3>
            <p>
              We reserve the right to remove or modify any listing that violates these Terms, applicable laws, or our content policies, without prior notice.
            </p>
          </section>

          {/* Rental Applications */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Rental Applications and Bookings</h2>
            
            <h3 className="text-xl font-semibold text-foreground">7.1 Application Process</h3>
            <p>
              Tenants may submit rental applications through our platform. Applications are subject to landlord approval and may require background checks, credit checks, employment verification, and reference checks.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">7.2 Application Fees</h3>
            <p>
              Application fees, if any, are non-refundable and cover administrative costs. These fees are clearly disclosed before submission.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">7.3 No Guarantee of Acceptance</h3>
            <p>
              Leap does not guarantee application approval. Landlords have sole discretion in tenant selection, subject to fair housing laws.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">7.4 Booking Confirmations</h3>
            <p>
              Once an application is approved and all parties execute a rental agreement, a booking is confirmed. The rental agreement governs the landlord-tenant relationship, not these Terms.
            </p>
          </section>

          {/* Payments */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Payments and Fees</h2>
            
            <h3 className="text-xl font-semibold text-foreground">8.1 Payment Processing</h3>
            <p>
              Payments are processed through secure third-party payment processors. By making payments, you agree to the payment processor's terms and conditions.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">8.2 Service Fees</h3>
            <p>Leap may charge service fees for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Rental application processing</li>
              <li>Booking facilitation</li>
              <li>Payment processing</li>
              <li>Premium features and services</li>
            </ul>
            <p className="mt-4">All fees are clearly disclosed before charging.</p>

            <h3 className="text-xl font-semibold text-foreground mt-6">8.3 Rent Payments</h3>
            <p>
              Tenants are responsible for timely rent payments as specified in their rental agreements. Late payments may incur fees as outlined in the rental agreement.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">8.4 Refund Policy</h3>
            <p>
              Refunds are handled according to the rental agreement between landlord and tenant. Service fees are generally non-refundable except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">8.5 Payment Disputes</h3>
            <p>
              Payment disputes should be resolved between landlords and tenants. Leap is not responsible for payment disputes but may assist in facilitation.
            </p>
          </section>

          {/* Property Visits */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Property Visits and Viewings</h2>
            <p>
              Our Service facilitates scheduling property visits. By scheduling a visit:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You agree to arrive at the scheduled time or provide reasonable notice of cancellation</li>
              <li>You acknowledge that property condition may vary from photos/descriptions</li>
              <li>You agree to conduct yourself respectfully during visits</li>
              <li>You accept that visits are subject to landlord availability and confirmation</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold text-foreground">10.1 Our Content</h3>
            <p>
              The Service, including its design, text, graphics, logos, images, software, and other content (excluding user-generated content), is owned by Leap and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">10.2 Limited License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes, subject to these Terms.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">10.3 User Content</h3>
            <p>
              You retain ownership of content you submit (photos, descriptions, reviews). However, you grant Leap a worldwide, non-exclusive, royalty-free, sublicensable license to use, reproduce, modify, and display your content in connection with the Service.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">10.4 Feedback</h3>
            <p>
              Any feedback, suggestions, or ideas you provide to us become our property, and we may use them without restriction or compensation.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">11. Third-Party Services and Links</h2>
            <p>
              Our Service may contain links to third-party websites, services, or integrations (payment processors, mapping services, identity verification). We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The availability, accuracy, or content of third-party services</li>
              <li>Third-party privacy practices or terms</li>
              <li>Any loss or damage from your use of third-party services</li>
            </ul>
            <p className="mt-4">
              Your use of third-party services is governed by their respective terms and policies.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">12. Disclaimers and Warranties</h2>
            
            <h3 className="text-xl font-semibold text-foreground">12.1 Platform Role</h3>
            <p>
              <strong>IMPORTANT:</strong> Leap is a platform that facilitates connections between landlords and tenants. We are not a party to rental agreements and do not act as a landlord, tenant, property manager, broker, or agent.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">12.2 No Warranties</h3>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Implied warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
              <li>Warranties regarding accuracy, reliability, or availability of the Service</li>
              <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
              <li>Warranties regarding property conditions, landlord representations, or tenant qualifications</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">12.3 User Responsibility</h3>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You are responsible for verifying listing accuracy and property conditions</li>
              <li>You should conduct your own due diligence before entering rental agreements</li>
              <li>Leap does not guarantee the accuracy of user-provided information</li>
              <li>Leap does not conduct comprehensive background checks on all users</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">13. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEAP AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, goodwill, or other intangible losses</li>
              <li>Damages arising from disputes between landlords and tenants</li>
              <li>Property damage, personal injury, or other harm occurring during property visits or tenancies</li>
              <li>Unauthorized access to or use of our servers or your personal information</li>
              <li>Interruption or cessation of the Service</li>
              <li>Bugs, viruses, or other harmful code transmitted through the Service</li>
              <li>Errors or inaccuracies in content</li>
              <li>User conduct or content</li>
            </ul>
            <p className="mt-4">
              <strong>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM OR (B) UGX 100,000.</strong>
            </p>
          </section>

          {/* Indemnification */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">14. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Leap and its officers, directors, employees, agents, and affiliates from any claims, losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your content or conduct</li>
              <li>Disputes between you and other users</li>
              <li>Your rental agreements or property transactions</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">15. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-foreground">15.1 Informal Resolution</h3>
            <p>
              Before filing a claim, you agree to contact us at <a href="mailto:legal@leap.ug" className="text-primary hover:underline">legal@leap.ug</a> to attempt informal resolution. We will attempt to resolve disputes in good faith.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">15.2 Arbitration Agreement</h3>
            <p>
              If informal resolution fails, you agree that any dispute arising from these Terms or the Service shall be resolved through binding arbitration rather than in court, except where prohibited by law.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">15.3 Class Action Waiver</h3>
            <p>
              You agree to bring claims only in your individual capacity and not as part of any class or representative action. Neither you nor Leap may participate in a class action or class-wide arbitration.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">16. Termination</h2>
            
            <h3 className="text-xl font-semibold text-foreground">16.1 Termination by You</h3>
            <p>
              You may close your account at any time by contacting us. Upon closure, you will no longer have access to your account and associated data.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">16.2 Termination by Us</h3>
            <p>
              We may suspend or terminate your account immediately, without notice, if you:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate these Terms</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Provide false information</li>
              <li>Abuse or harass other users</li>
              <li>Fail to pay required fees</li>
              <li>For any other reason at our sole discretion</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">16.3 Effects of Termination</h3>
            <p>
              Upon termination, your right to use the Service immediately ceases. Provisions that should survive termination (including disclaimers, limitations of liability, and indemnification) will remain in effect.
            </p>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">17. Privacy</h2>
            <p>
              Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which describes how we collect, use, and disclose your personal information. By using the Service, you consent to our privacy practices.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">18. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be notified through:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting a prominent notice on the Service</li>
              <li>Sending an email notification</li>
              <li>In-app notifications</li>
            </ul>
            <p className="mt-4">
              Changes become effective 30 days after posting (or immediately for legal or security reasons). Your continued use after changes constitutes acceptance. If you don't agree, you must stop using the Service.
            </p>
          </section>

          {/* General Provisions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">19. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-foreground">19.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy and any other legal notices published on the Service, constitute the entire agreement between you and Leap.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">19.2 Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">19.3 No Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">19.4 Assignment</h3>
            <p>
              You may not assign or transfer these Terms or your rights under them without our written consent. We may assign our rights without restriction.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">19.5 Force Majeure</h3>
            <p>
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, riots, or governmental actions.
            </p>
          </section>

          {/* Governing Law */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">20. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of Uganda, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Kampala, Uganda, and you consent to personal jurisdiction in these courts.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">21. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg space-y-3 mt-4">
              <p><strong>Leap - Legal Department</strong></p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Email:</span>
                <a href="mailto:legal@leap.ug" className="text-primary hover:underline">legal@leap.ug</a>
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
              By using Leap, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
