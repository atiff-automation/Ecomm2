/**
 * Terms of Service Page - JRM E-commerce Platform
 * Malaysian Legal Compliance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Terms of Service
        </h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 6, 2025
              <br />
              <strong>Last Updated:</strong> August 6, 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="mb-4">
                  By accessing and using JRM E-commerce platform ("Platform"),
                  you accept and agree to be bound by the terms and provision of
                  this agreement. If you do not agree to abide by the above,
                  please do not use this service.
                </p>
                <p>
                  This Platform is operated by JRM E-commerce Sdn Bhd, a company
                  incorporated under the laws of Malaysia.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  2. Membership Program
                </h2>
                <p className="mb-4">
                  <strong>2.1 Eligibility:</strong> Membership is automatically
                  offered to customers who make qualifying purchases totaling
                  RM80 or more in eligible product categories.
                </p>
                <p className="mb-4">
                  <strong>2.2 Benefits:</strong> Members receive access to
                  exclusive member pricing on all products. Member prices are
                  clearly displayed alongside regular prices.
                </p>
                <p className="mb-4">
                  <strong>2.3 Terms:</strong> Membership is free and requires
                  account registration. Members must log in to access member
                  pricing on subsequent purchases.
                </p>
                <p>
                  <strong>2.4 Termination:</strong> We reserve the right to
                  terminate membership for violation of these terms or
                  fraudulent activity.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  3. Use of Platform
                </h2>
                <p className="mb-4">
                  <strong>3.1 Permitted Use:</strong> You may use this Platform
                  for lawful purposes only and in accordance with these Terms.
                </p>
                <p className="mb-4">
                  <strong>3.2 Prohibited Activities:</strong> You agree not to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>
                    Use the Platform for any unlawful purpose or to solicit
                    others to engage in unlawful acts
                  </li>
                  <li>
                    Violate any international, federal, provincial, or state
                    regulations, rules, laws, or local ordinances
                  </li>
                  <li>
                    Transmit or procure the sending of any advertising or
                    promotional material without our prior written consent
                  </li>
                  <li>
                    Impersonate or attempt to impersonate another user, person,
                    or entity
                  </li>
                  <li>
                    Engage in any other conduct that restricts or inhibits
                    anyone's use or enjoyment of the Platform
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  4. Products and Services
                </h2>
                <p className="mb-4">
                  <strong>4.1 Product Information:</strong> We attempt to be as
                  accurate as possible with product descriptions, pricing, and
                  availability. However, we do not warrant that product
                  descriptions or other content is accurate, complete, reliable,
                  or error-free.
                </p>
                <p className="mb-4">
                  <strong>4.2 Pricing:</strong> All prices are listed in
                  Malaysian Ringgit (RM) and include applicable taxes unless
                  otherwise stated. Member pricing is available to registered
                  members only.
                </p>
                <p>
                  <strong>4.3 Availability:</strong> Product availability may
                  change without notice. We reserve the right to limit the
                  quantity of any products or services we offer.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  5. Orders and Payment
                </h2>
                <p className="mb-4">
                  <strong>5.1 Order Acceptance:</strong> Your receipt of an
                  order confirmation does not signify our acceptance of your
                  order. We reserve the right to accept or decline your order
                  for any reason.
                </p>
                <p className="mb-4">
                  <strong>5.2 Payment:</strong> Payment must be made at the time
                  of purchase through our approved payment methods. We use
                  Billplz for secure payment processing.
                </p>
                <p>
                  <strong>5.3 Order Cancellation:</strong> We reserve the right
                  to refuse or cancel your order at any time for reasons
                  including but not limited to product availability, errors in
                  the description or price, or other reasons.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  6. Shipping and Delivery
                </h2>
                <p className="mb-4">
                  We will ship your order to the address you specify. Shipping
                  costs and estimated delivery times are provided during
                  checkout. We use EasyParcel for shipping services within
                  Malaysia.
                </p>
                <p>
                  Risk of loss and title for items purchased pass to you upon
                  delivery to the shipping carrier.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  7. Returns and Refunds
                </h2>
                <p className="mb-4">
                  Returns and refunds are governed by our separate Return and
                  Refund Policy, which forms part of these Terms of Service.
                </p>
                <p>
                  Generally, items may be returned within 14 days of delivery in
                  original condition for a full refund or exchange.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  8. Privacy Policy
                </h2>
                <p>
                  Your privacy is important to us. Our Privacy Policy explains
                  how we collect, use, and protect your information when you use
                  our Platform. By using our Platform, you agree to the
                  collection and use of information in accordance with our
                  Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  9. Limitation of Liability
                </h2>
                <p className="mb-4">
                  In no case shall JRM E-commerce Sdn Bhd, nor its directors,
                  employees, affiliates, agents, contractors, interns,
                  suppliers, service providers, or licensors be liable for any
                  injury, loss, claim, or any direct, indirect, incidental,
                  punitive, special, or consequential damages of any kind.
                </p>
                <p>
                  This limitation of liability applies regardless of whether the
                  alleged liability is based on contract, tort, negligence,
                  strict liability, or any other basis.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  10. Malaysian Law
                </h2>
                <p className="mb-4">
                  These Terms of Service and any separate agreements whereby we
                  provide you services shall be governed by and construed in
                  accordance with the laws of Malaysia.
                </p>
                <p>
                  Any legal action or proceeding arising under these Terms of
                  Service will be brought exclusively in the courts of Malaysia.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  11. Contact Information
                </h2>
                <p>
                  If you have any questions about these Terms of Service, please
                  contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p>
                    <strong>JRM E-commerce Sdn Bhd</strong>
                  </p>
                  <p>Email: support@jrm-ecommerce.com</p>
                  <p>Phone: +60 3-1234 5678</p>
                  <p>Address: [Company Address], Malaysia</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  12. Changes to Terms
                </h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or
                  replace these Terms of Service at any time. If a revision is
                  material, we will try to provide at least 30 days notice prior
                  to any new terms taking effect.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            For questions about these terms, please contact our customer service
            team.
          </p>
        </div>
      </div>
    </div>
  );
}
