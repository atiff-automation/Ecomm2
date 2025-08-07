/**
 * Privacy Policy Page - JRM E-commerce Platform
 * Malaysian PDPA Compliance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, FileText, Phone } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 6, 2025<br />
              <strong>Last Updated:</strong> August 6, 2025<br />
              <strong>PDPA Compliance:</strong> This policy complies with Malaysia's Personal Data Protection Act 2010
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  1. Introduction
                </h2>
                <p className="mb-4">
                  JRM E-commerce Sdn Bhd ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our e-commerce platform.
                </p>
                <p>
                  This policy complies with Malaysia's Personal Data Protection Act 2010 (PDPA) and other applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  2. Information We Collect
                </h2>
                
                <h3 className="text-lg font-medium mb-3">2.1 Personal Information You Provide</h3>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li>Name, email address, phone number</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through Billplz)</li>
                  <li>Account credentials and membership information</li>
                  <li>Communication preferences</li>
                  <li>Product reviews and feedback</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">2.2 Information Collected Automatically</h3>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li>IP address, device information, browser type</li>
                  <li>Shopping behavior and purchase history</li>
                  <li>Website usage data and cookies</li>
                  <li>Location data (if enabled)</li>
                  <li>Session information and preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Eye className="mr-2 h-5 w-5" />
                  3. How We Use Your Information
                </h2>
                <p className="mb-4">We use your personal information for the following purposes:</p>
                
                <h3 className="text-lg font-medium mb-3">3.1 Primary Business Purposes</h3>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li>Process orders and manage your account</li>
                  <li>Provide customer support and services</li>
                  <li>Manage membership program and benefits</li>
                  <li>Send order confirmations and shipping updates</li>
                  <li>Process payments and prevent fraud</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">3.2 Marketing and Communication (With Consent)</h3>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li>Send promotional offers and member benefits</li>
                  <li>Newsletter and product updates</li>
                  <li>Personalized product recommendations</li>
                  <li>Market research and surveys</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">3.3 Legal and Operational Requirements</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Comply with Malaysian tax and regulatory requirements</li>
                  <li>Maintain business records and audit trails</li>
                  <li>Protect against fraud and security threats</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  4. Data Sharing and Disclosure
                </h2>
                <p className="mb-4">We do not sell your personal information. We may share your information with:</p>

                <h3 className="text-lg font-medium mb-3">4.1 Service Providers</h3>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li><strong>Billplz:</strong> Payment processing (PCI DSS compliant)</li>
                  <li><strong>EasyParcel:</strong> Shipping and logistics</li>
                  <li><strong>Email services:</strong> Order confirmations and communications</li>
                  <li><strong>Cloud hosting:</strong> Secure data storage and processing</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.2 Legal Requirements</h3>
                <p className="mb-4">We may disclose information when required by:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Malaysian government authorities</li>
                  <li>Tax authorities and regulatory bodies</li>
                  <li>Law enforcement agencies</li>
                  <li>Court orders or legal processes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Your PDPA Rights</h2>
                <p className="mb-4">Under Malaysia's Personal Data Protection Act 2010, you have the right to:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Access Rights</h4>
                    <p className="text-sm">Request access to your personal data and information about how we process it.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Correction Rights</h4>
                    <p className="text-sm">Request correction of inaccurate or incomplete personal data.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Data Portability</h4>
                    <p className="text-sm">Request a copy of your data in a structured, machine-readable format.</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Withdrawal of Consent</h4>
                    <p className="text-sm">Withdraw consent for marketing communications and optional data processing.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
                <p className="mb-4">We implement robust security measures to protect your personal information:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Encryption:</strong> All data transmitted is encrypted using TLS/SSL</li>
                  <li><strong>Access Controls:</strong> Role-based access to personal data</li>
                  <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
                  <li><strong>Data Minimization:</strong> We only collect necessary information</li>
                  <li><strong>Staff Training:</strong> Regular privacy and security training for employees</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
                <p className="mb-4">We retain your personal information for as long as necessary to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Provide our services and maintain your account</li>
                  <li>Comply with Malaysian legal and tax requirements (7 years for financial records)</li>
                  <li>Resolve disputes and enforce our agreements</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>
                <p className="mt-4">
                  When data is no longer needed, it is securely deleted or anonymized in accordance with our data retention policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Cookies and Tracking</h2>
                <p className="mb-4">
                  We use cookies and similar technologies to improve your browsing experience:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us improve website performance</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences</li>
                  <li><strong>Analytics Cookies:</strong> Understand how visitors use our site</li>
                </ul>
                <p className="mt-4">
                  You can manage cookie preferences through your browser settings or our cookie management tool.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Children's Privacy</h2>
                <p>
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. International Data Transfers</h2>
                <p className="mb-4">
                  Your personal data is primarily processed and stored in Malaysia. If we need to transfer data internationally, we ensure appropriate safeguards are in place, including:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Adequacy decisions by relevant authorities</li>
                  <li>Standard contractual clauses</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  11. Contact Information
                </h2>
                <p className="mb-4">For privacy-related questions or to exercise your PDPA rights, contact us:</p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p><strong>Data Protection Officer</strong></p>
                  <p>JRM E-commerce Sdn Bhd</p>
                  <p>Email: privacy@jrm-ecommerce.com</p>
                  <p>Phone: +60 3-1234 5678</p>
                  <p>Address: [Company Address], Malaysia</p>
                </div>

                <p className="mt-4 text-sm">
                  You may also file a complaint with the Personal Data Protection Department of Malaysia if you believe we have not handled your personal data appropriately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">12. Policy Updates</h2>
                <p>
                  We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. We will notify you of material changes by email or through our website. The "Last Updated" date at the top of this policy indicates when the latest revision was made.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            This policy ensures compliance with Malaysian PDPA requirements and international privacy standards.
          </p>
        </div>
      </div>
    </div>
  );
}