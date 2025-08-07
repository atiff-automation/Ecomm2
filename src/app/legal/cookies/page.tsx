/**
 * Cookie Policy Page - JRM E-commerce Platform
 * GDPR and Malaysian Privacy Compliance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Shield, Settings, Eye, BarChart, Target } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Cookie Policy</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 6, 2025
              <br />
              <strong>Last Updated:</strong> August 6, 2025
              <br />
              <strong>Compliance:</strong> GDPR, Malaysian PDPA, and
              international privacy standards
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Cookie className="mr-2 h-5 w-5" />
                  1. What Are Cookies?
                </h2>
                <p className="mb-4">
                  Cookies are small text files that are stored on your device
                  (computer, smartphone, tablet) when you visit our website.
                  They help our website function properly and provide you with a
                  better browsing experience.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800 mb-2">
                    Cookie Information Storage
                  </p>
                  <p className="text-blue-700 text-sm">
                    Cookies may store information such as your preferences,
                    login status, shopping cart contents, and website settings
                    to enhance your experience on future visits.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  2. Types of Cookies We Use
                </h2>

                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-semibold text-green-800 flex items-center mb-2">
                      <Shield className="mr-2 h-4 w-4" />
                      Essential Cookies (Always Active)
                    </h3>
                    <p className="text-green-700 text-sm mb-2">
                      These cookies are necessary for the website to function
                      properly and cannot be disabled.
                    </p>
                    <ul className="text-green-600 text-sm space-y-1">
                      <li>
                        • <strong>Authentication:</strong> Keep you logged in to
                        your account
                      </li>
                      <li>
                        • <strong>Session Management:</strong> Maintain your
                        shopping cart contents
                      </li>
                      <li>
                        • <strong>Security:</strong> Protect against fraud and
                        security threats
                      </li>
                      <li>
                        • <strong>Load Balancing:</strong> Distribute website
                        traffic efficiently
                      </li>
                      <li>
                        • <strong>CSRF Protection:</strong> Secure form
                        submissions
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold text-blue-800 flex items-center mb-2">
                      <Settings className="mr-2 h-4 w-4" />
                      Functional Cookies (Optional)
                    </h3>
                    <p className="text-blue-700 text-sm mb-2">
                      These cookies enhance your browsing experience by
                      remembering your preferences.
                    </p>
                    <ul className="text-blue-600 text-sm space-y-1">
                      <li>
                        • <strong>Language Preferences:</strong> Remember your
                        preferred language
                      </li>
                      <li>
                        • <strong>Display Settings:</strong> Save your theme and
                        layout preferences
                      </li>
                      <li>
                        • <strong>Location Data:</strong> Remember your delivery
                        location
                      </li>
                      <li>
                        • <strong>Accessibility:</strong> Store accessibility
                        settings
                      </li>
                      <li>
                        • <strong>Recently Viewed:</strong> Track products
                        you've recently browsed
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <h3 className="font-semibold text-yellow-800 flex items-center mb-2">
                      <BarChart className="mr-2 h-4 w-4" />
                      Analytics Cookies (Optional)
                    </h3>
                    <p className="text-yellow-700 text-sm mb-2">
                      These cookies help us understand how visitors interact
                      with our website.
                    </p>
                    <ul className="text-yellow-600 text-sm space-y-1">
                      <li>
                        • <strong>Google Analytics:</strong> Track website usage
                        and performance
                      </li>
                      <li>
                        • <strong>Page Views:</strong> Monitor popular pages and
                        products
                      </li>
                      <li>
                        • <strong>User Journey:</strong> Understand how users
                        navigate our site
                      </li>
                      <li>
                        • <strong>Error Tracking:</strong> Identify and fix
                        website issues
                      </li>
                      <li>
                        • <strong>Performance Monitoring:</strong> Optimize
                        loading times
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h3 className="font-semibold text-purple-800 flex items-center mb-2">
                      <Target className="mr-2 h-4 w-4" />
                      Marketing Cookies (Optional)
                    </h3>
                    <p className="text-purple-700 text-sm mb-2">
                      These cookies help us show you relevant advertisements and
                      measure campaign effectiveness.
                    </p>
                    <ul className="text-purple-600 text-sm space-y-1">
                      <li>
                        • <strong>Facebook Pixel:</strong> Track conversions
                        from Facebook ads
                      </li>
                      <li>
                        • <strong>Google Ads:</strong> Measure advertising
                        campaign performance
                      </li>
                      <li>
                        • <strong>Retargeting:</strong> Show relevant ads on
                        other websites
                      </li>
                      <li>
                        • <strong>Affiliate Tracking:</strong> Credit affiliate
                        partners for referrals
                      </li>
                      <li>
                        • <strong>Email Marketing:</strong> Track email campaign
                        engagement
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  3. Detailed Cookie Information
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left">
                          Cookie Name
                        </th>
                        <th className="border border-gray-300 p-3 text-left">
                          Purpose
                        </th>
                        <th className="border border-gray-300 p-3 text-left">
                          Duration
                        </th>
                        <th className="border border-gray-300 p-3 text-left">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          __session
                        </td>
                        <td className="border border-gray-300 p-3">
                          User session management
                        </td>
                        <td className="border border-gray-300 p-3">Session</td>
                        <td className="border border-gray-300 p-3">
                          Essential
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          cart_id
                        </td>
                        <td className="border border-gray-300 p-3">
                          Shopping cart persistence
                        </td>
                        <td className="border border-gray-300 p-3">30 days</td>
                        <td className="border border-gray-300 p-3">
                          Essential
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          auth_token
                        </td>
                        <td className="border border-gray-300 p-3">
                          Authentication state
                        </td>
                        <td className="border border-gray-300 p-3">7 days</td>
                        <td className="border border-gray-300 p-3">
                          Essential
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          theme_preference
                        </td>
                        <td className="border border-gray-300 p-3">
                          UI theme selection
                        </td>
                        <td className="border border-gray-300 p-3">1 year</td>
                        <td className="border border-gray-300 p-3">
                          Functional
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          language
                        </td>
                        <td className="border border-gray-300 p-3">
                          Language preference
                        </td>
                        <td className="border border-gray-300 p-3">1 year</td>
                        <td className="border border-gray-300 p-3">
                          Functional
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          _ga
                        </td>
                        <td className="border border-gray-300 p-3">
                          Google Analytics tracking
                        </td>
                        <td className="border border-gray-300 p-3">2 years</td>
                        <td className="border border-gray-300 p-3">
                          Analytics
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-mono">
                          _fbp
                        </td>
                        <td className="border border-gray-300 p-3">
                          Facebook Pixel tracking
                        </td>
                        <td className="border border-gray-300 p-3">90 days</td>
                        <td className="border border-gray-300 p-3">
                          Marketing
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  4. Managing Your Cookie Preferences
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Cookie Consent Banner
                    </h3>
                    <p className="text-blue-700 text-sm">
                      When you first visit our website, you'll see a cookie
                      consent banner. You can choose to accept all cookies,
                      accept only essential cookies, or customize your
                      preferences.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">
                        Website Cookie Settings
                      </h3>
                      <p className="text-sm mb-2">
                        Change your cookie preferences at any time:
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Click "Cookie Preferences" in the footer</li>
                        <li>• Access through Account Settings</li>
                        <li>• Use the floating cookie icon (if available)</li>
                        <li>• Changes take effect immediately</li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Browser Settings</h3>
                      <p className="text-sm mb-2">
                        Control cookies through your browser:
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Block all cookies (may affect functionality)</li>
                        <li>• Delete existing cookies</li>
                        <li>• Set cookie preferences per website</li>
                        <li>• Enable/disable third-party cookies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  5. Browser-Specific Instructions
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Google Chrome</h3>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Click the three dots menu → Settings</li>
                      <li>Go to Privacy and security → Cookies</li>
                      <li>Choose your cookie preferences</li>
                      <li>Manage exceptions for specific sites</li>
                    </ol>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Mozilla Firefox</h3>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Click menu → Options → Privacy & Security</li>
                      <li>Find Cookies and Site Data section</li>
                      <li>Manage Data or clear existing cookies</li>
                      <li>Set cookie acceptance preferences</li>
                    </ol>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Safari</h3>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Safari menu → Preferences → Privacy</li>
                      <li>Choose cookie blocking preferences</li>
                      <li>Click Manage Website Data</li>
                      <li>Remove or modify site-specific settings</li>
                    </ol>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Microsoft Edge</h3>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Click three dots → Settings → Privacy</li>
                      <li>Select Cookies and site permissions</li>
                      <li>Manage cookies and site data</li>
                      <li>Configure tracking prevention</li>
                    </ol>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  6. Impact of Disabling Cookies
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      ⚠️ Essential Cookies Disabled
                    </h3>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Cannot maintain login session</li>
                      <li>• Shopping cart will not persist</li>
                      <li>• Security features may not work</li>
                      <li>• Website functionality may be limited</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      ℹ️ Functional Cookies Disabled
                    </h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Language preference not remembered</li>
                      <li>• Need to reconfigure settings each visit</li>
                      <li>• Recently viewed products not saved</li>
                      <li>• Personalized experience limited</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      📊 Analytics/Marketing Cookies Disabled
                    </h3>
                    <ul className="text-gray-700 text-sm space-y-1">
                      <li>• Less relevant advertisements</li>
                      <li>• Cannot measure website performance</li>
                      <li>• Limited ability to improve user experience</li>
                      <li>• Retargeting campaigns won't work</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  7. Third-Party Cookies
                </h2>
                <p className="mb-4">
                  We use services from trusted third parties that may set their
                  own cookies:
                </p>

                <div className="space-y-3">
                  <div className="p-3 border rounded">
                    <p>
                      <strong>Google Analytics:</strong> Website traffic
                      analysis
                    </p>
                    <p className="text-sm text-gray-600">
                      Privacy Policy:{' '}
                      <a
                        href="https://policies.google.com/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        Google Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="p-3 border rounded">
                    <p>
                      <strong>Facebook Pixel:</strong> Advertising and
                      conversion tracking
                    </p>
                    <p className="text-sm text-gray-600">
                      Privacy Policy:{' '}
                      <a
                        href="https://www.facebook.com/privacy/policy/"
                        className="text-blue-600 hover:underline"
                      >
                        Facebook Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="p-3 border rounded">
                    <p>
                      <strong>Billplz:</strong> Payment processing
                    </p>
                    <p className="text-sm text-gray-600">
                      Privacy Policy:{' '}
                      <a
                        href="https://www.billplz.com/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        Billplz Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="p-3 border rounded">
                    <p>
                      <strong>EasyParcel:</strong> Shipping and logistics
                    </p>
                    <p className="text-sm text-gray-600">
                      Privacy Policy:{' '}
                      <a
                        href="https://www.easyparcel.com/privacy"
                        className="text-blue-600 hover:underline"
                      >
                        EasyParcel Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  8. Mobile Apps and Cookies
                </h2>
                <p className="mb-4">
                  If you access our website through a mobile app or mobile
                  browser, similar tracking technologies may be used. You can
                  control these through your device settings:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>iOS:</strong> Settings → Privacy → Tracking → Allow
                    Apps to Request to Track
                  </li>
                  <li>
                    <strong>Android:</strong> Settings → Privacy → Ads → Opt out
                    of Ads Personalization
                  </li>
                  <li>
                    <strong>Mobile Browser:</strong> Follow desktop browser
                    instructions above
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Data Security</h2>
                <p className="mb-4">
                  Cookie data is protected using industry-standard security
                  measures:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Encryption:</strong> Sensitive cookie data is
                    encrypted
                  </li>
                  <li>
                    <strong>Secure Transmission:</strong> Cookies sent over
                    HTTPS connections
                  </li>
                  <li>
                    <strong>HttpOnly Flags:</strong> Prevents access from
                    JavaScript for security cookies
                  </li>
                  <li>
                    <strong>SameSite Attributes:</strong> Protects against CSRF
                    attacks
                  </li>
                  <li>
                    <strong>Regular Cleanup:</strong> Expired cookies are
                    automatically removed
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  10. Children's Privacy
                </h2>
                <p>
                  Our website is not intended for children under 13. We do not
                  knowingly collect cookie information from children under 13.
                  Parents can control cookie settings on devices used by their
                  children.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  11. Changes to This Cookie Policy
                </h2>
                <p className="mb-4">
                  We may update this Cookie Policy from time to time to reflect
                  changes in our practices or applicable laws. When we make
                  significant changes:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>We'll update the "Last Updated" date at the top</li>
                  <li>We'll notify you through a banner on our website</li>
                  <li>We may ask for renewed consent for new cookie types</li>
                  <li>
                    You'll have the opportunity to review and update your
                    preferences
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Eye className="mr-2 h-5 w-5" />
                  12. Contact Information
                </h2>
                <p className="mb-4">
                  For questions about our cookie policy or to exercise your
                  privacy rights:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Privacy Officer</strong>
                  </p>
                  <p>JRM E-commerce Sdn Bhd</p>
                  <p>Email: privacy@jrm-ecommerce.com</p>
                  <p>Phone: +60 3-1234 5678</p>
                  <p>Address: [Company Address], Malaysia</p>
                  <p className="mt-2 text-sm">
                    <strong>Cookie Preferences:</strong> You can also manage
                    cookies directly through our website's cookie settings.
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Manage Cookie Preferences
          </button>
          <p className="text-sm text-gray-600">
            This policy ensures transparency about our cookie usage and respects
            your privacy choices.
          </p>
        </div>
      </div>
    </div>
  );
}
