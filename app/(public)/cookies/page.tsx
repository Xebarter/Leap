export const metadata = {
  title: 'Cookie Policy - Leap',
  description: 'Learn about how Leap uses cookies and similar tracking technologies to improve your experience.',
}

export default function CookiesPage() {
  return (
    <main className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-12">
          Effective Date: January 23, 2026 | Last Updated: January 23, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              This Cookie Policy explains how Leap ("we," "us," or "our") uses cookies and similar tracking technologies when you visit our website and mobile application (collectively, the "Service").
            </p>
            <p>
              By using our Service, you consent to the use of cookies in accordance with this Cookie Policy. If you do not agree to our use of cookies, you should adjust your browser settings or discontinue use of the Service.
            </p>
          </section>

          {/* What Are Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device (computer, smartphone, tablet) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p>
              Cookies allow websites to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Keep you signed in to your account</li>
              <li>Understand how you use the website</li>
              <li>Provide personalized content and recommendations</li>
              <li>Improve website performance and functionality</li>
            </ul>
          </section>

          {/* Types of Cookies We Use */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Types of Cookies We Use</h2>

            <h3 className="text-xl font-semibold text-foreground">3.1 Essential Cookies</h3>
            <p>
              These cookies are strictly necessary for the Service to function properly. They enable core functionality such as security, network management, and accessibility.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-2">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Authentication cookies (keep you logged in)</li>
                <li>Security cookies (prevent fraud and abuse)</li>
                <li>Load balancing cookies (distribute server traffic)</li>
                <li>Session cookies (maintain your session state)</li>
              </ul>
              <p className="mt-3 text-sm"><strong>Duration:</strong> Session (deleted when you close your browser) or up to 1 year</p>
              <p className="text-sm"><strong>Can be disabled:</strong> No (required for the Service to work)</p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.2 Functional Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences and choices.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-2">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Language preferences</li>
                <li>Location settings (for property searches)</li>
                <li>Display preferences (light/dark mode)</li>
                <li>Recently viewed properties</li>
                <li>Saved searches and filters</li>
              </ul>
              <p className="mt-3 text-sm"><strong>Duration:</strong> Up to 2 years</p>
              <p className="text-sm"><strong>Can be disabled:</strong> Yes (may affect functionality)</p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.3 Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with our Service by collecting and reporting information anonymously.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-2">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Google Analytics (website usage statistics)</li>
                <li>Page views and time spent on pages</li>
                <li>Navigation paths and click patterns</li>
                <li>Device and browser information</li>
                <li>Error tracking and performance monitoring</li>
              </ul>
              <p className="mt-3 text-sm"><strong>Duration:</strong> Up to 2 years</p>
              <p className="text-sm"><strong>Can be disabled:</strong> Yes</p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.4 Marketing/Advertising Cookies</h3>
            <p>
              These cookies track your browsing activity to deliver relevant advertisements and measure campaign effectiveness.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-2">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Facebook Pixel (retargeting)</li>
                <li>Google Ads (conversion tracking)</li>
                <li>Property recommendations based on browsing history</li>
                <li>Ad performance measurement</li>
                <li>Cross-device tracking</li>
              </ul>
              <p className="mt-3 text-sm"><strong>Duration:</strong> Up to 2 years</p>
              <p className="text-sm"><strong>Can be disabled:</strong> Yes</p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-6">3.5 Third-Party Cookies</h3>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We do not control these cookies.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mt-2">
              <p className="font-semibold mb-2">Third-party services we use:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Google Maps (property location display)</li>
                <li>YouTube (embedded videos)</li>
                <li>Payment processors (Stripe, PayPal)</li>
                <li>Social media platforms (share buttons)</li>
                <li>Chat and support widgets</li>
              </ul>
            </div>
          </section>

          {/* Other Tracking Technologies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Other Tracking Technologies</h2>
            
            <h3 className="text-xl font-semibold text-foreground">4.1 Web Beacons (Pixels)</h3>
            <p>
              Small graphic images embedded in web pages or emails that allow us to track page views, email opens, and user behavior.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.2 Local Storage</h3>
            <p>
              Browser storage that allows us to store data locally on your device for improved performance and offline functionality.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.3 Session Storage</h3>
            <p>
              Temporary storage that maintains data only for the duration of your browser session.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">4.4 Mobile Device Identifiers</h3>
            <p>
              Our mobile app may use device identifiers (IDFA on iOS, Advertising ID on Android) for analytics and advertising purposes.
            </p>
          </section>

          {/* How We Use Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. How We Use Cookies</h2>
            <p>We use cookies and similar technologies for the following purposes:</p>
            
            <h3 className="text-xl font-semibold text-foreground">5.1 Authentication and Security</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Verify your identity when you log in</li>
              <li>Keep your account secure</li>
              <li>Prevent fraudulent activity</li>
              <li>Detect and prevent security threats</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">5.2 Performance and Functionality</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Remember your preferences and settings</li>
              <li>Enable features like saved searches and favorites</li>
              <li>Improve page load times</li>
              <li>Provide seamless navigation</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">5.3 Analytics and Research</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Understand how you use our Service</li>
              <li>Identify popular features and content</li>
              <li>Measure effectiveness of marketing campaigns</li>
              <li>Conduct A/B testing and experiments</li>
              <li>Improve user experience based on data insights</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">5.4 Personalization</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Show personalized property recommendations</li>
              <li>Remember your search criteria and filters</li>
              <li>Display relevant content based on your interests</li>
              <li>Customize the user interface to your preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">5.5 Advertising and Marketing</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Show relevant advertisements on our platform and other websites</li>
              <li>Measure ad performance and conversion rates</li>
              <li>Retarget users who visited specific properties</li>
              <li>Limit the number of times you see an ad</li>
            </ul>
          </section>

          {/* Managing Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. How to Manage Cookies</h2>
            
            <h3 className="text-xl font-semibold text-foreground">6.1 Browser Settings</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="mt-4">
              <strong>Note:</strong> Blocking or deleting cookies may affect the functionality of our Service and prevent you from using certain features.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.2 Browser-Specific Instructions</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3 mt-2">
              <p><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</p>
              <p><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</p>
              <p><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</p>
              <p><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</p>
              <p className="text-sm pt-2">
                For detailed instructions, visit your browser's help center.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.3 Opt-Out of Interest-Based Advertising</h3>
            <p>You can opt out of personalized advertising through:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative (NAI)</a></li>
              <li><a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance (DAA)</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">European Interactive Digital Advertising Alliance (EDAA)</a></li>
              <li>Google Ads Settings</li>
              <li>Facebook Ad Preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.4 Do Not Track (DNT)</h3>
            <p>
              Some browsers have a "Do Not Track" feature that signals websites not to track you. However, there is no universal standard for how to respond to DNT signals. We do not currently respond to DNT signals.
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">6.5 Mobile App Settings</h3>
            <p>For mobile apps, you can:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>iOS:</strong> Settings → Privacy → Tracking → Disable "Allow Apps to Request to Track"</li>
              <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
            </ul>
          </section>

          {/* Cookie Consent */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Cookie Consent</h2>
            <p>
              When you first visit our Service, we will show you a cookie consent banner explaining our use of cookies. You can choose to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Accept All:</strong> Consent to all cookies, including optional marketing cookies</li>
              <li><strong>Reject Non-Essential:</strong> Only allow essential cookies required for the Service to function</li>
              <li><strong>Customize:</strong> Choose which categories of cookies to enable</li>
            </ul>
            <p className="mt-4">
              You can change your cookie preferences at any time through the cookie settings in your account or by clearing your browser cookies.
            </p>
          </section>

          {/* Updates to This Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Updates to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our practices. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification (for significant changes)</li>
            </ul>
            <p className="mt-4">
              Your continued use of the Service after changes constitutes acceptance of the updated Cookie Policy.
            </p>
          </section>

          {/* More Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. More Information</h2>
            <p>
              For more information about how we handle your personal data, please see our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
            <p>
              To learn more about cookies in general, visit <a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">All About Cookies</a>.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Contact Us</h2>
            <p>
              If you have any questions about this Cookie Policy or our use of cookies, please contact us:
            </p>
            <div className="bg-muted/50 p-6 rounded-lg space-y-3 mt-4">
              <p><strong>Leap - Cookie Policy Inquiries</strong></p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Email:</span>
                <a href="mailto:privacy@leap.ug" className="text-primary hover:underline">privacy@leap.ug</a>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">Phone:</span>
                <a href="tel:+256700000000" className="text-primary hover:underline">+256 700 000 000</a>
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
              This Cookie Policy is part of our overall commitment to transparency and user privacy.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
