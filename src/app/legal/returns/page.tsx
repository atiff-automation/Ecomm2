/**
 * Return & Refund Policy Page - JRM E-commerce Platform
 * Malaysian E-commerce Compliance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RotateCcw,
  Clock,
  CreditCard,
  Package,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function ReturnRefundPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Return & Refund Policy
        </h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 6, 2025
              <br />
              <strong>Last Updated:</strong> August 6, 2025
              <br />
              <strong>Compliance:</strong> Malaysian Consumer Protection Act
              1999
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  1. Return Policy Overview
                </h2>
                <p className="mb-4">
                  At JRM E-commerce, we want you to be completely satisfied with
                  your purchase. If you're not happy with your order, we offer a
                  comprehensive return and refund policy that complies with
                  Malaysian consumer protection laws.
                </p>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="flex items-center font-semibold text-green-800">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    14-Day Return Policy
                  </p>
                  <p className="text-green-700 mt-2">
                    You have 14 days from the date of delivery to return
                    eligible items for a full refund or exchange.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  2. Return Timeframe
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Standard Items
                    </h3>
                    <p className="text-sm mb-2">
                      <strong>Return Window:</strong> 14 days from delivery
                    </p>
                    <p className="text-sm">
                      <strong>Processing Time:</strong> 3-5 business days after
                      we receive your return
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Electronics & Gadgets
                    </h3>
                    <p className="text-sm mb-2">
                      <strong>Return Window:</strong> 7 days from delivery
                    </p>
                    <p className="text-sm">
                      <strong>Condition:</strong> Original packaging and
                      accessories required
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  3. Eligible Items for Return
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">
                      ✅ Items You Can Return:
                    </h3>
                    <ul className="list-disc list-inside text-green-700 space-y-1">
                      <li>
                        Items in original, unused condition with tags attached
                      </li>
                      <li>Items in original packaging with all accessories</li>
                      <li>
                        Defective or damaged items (we'll cover return shipping)
                      </li>
                      <li>Items that don't match the description</li>
                      <li>Wrong items sent by mistake</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">
                      ❌ Items You Cannot Return:
                    </h3>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      <li>Personalized or customized items</li>
                      <li>Perishable goods (food, flowers, etc.)</li>
                      <li>Intimate or sanitary goods (underwear, swimwear)</li>
                      <li>Items damaged by misuse or normal wear</li>
                      <li>Gift cards and digital products</li>
                      <li>
                        Items purchased with special promotions (case-by-case
                        basis)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  4. How to Return an Item
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold mb-2">
                      Step 1: Initiate Return Request
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>• Log into your account and go to "My Orders"</li>
                      <li>
                        • Click "Return Item" next to the eligible product
                      </li>
                      <li>
                        • Fill out the return reason and any additional details
                      </li>
                      <li>• Submit your return request for approval</li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold mb-2">
                      Step 2: Package Your Return
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>• Use original packaging if possible</li>
                      <li>
                        • Include all original accessories and documentation
                      </li>
                      <li>• Print and include the return authorization form</li>
                      <li>• Pack securely to prevent damage during shipping</li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold mb-2">
                      Step 3: Ship Your Return
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>• Use the prepaid return label (if provided)</li>
                      <li>• Or arrange pickup through our shipping partner</li>
                      <li>• Keep tracking number for your records</li>
                      <li>
                        • Returns typically take 2-5 business days to reach us
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  5. Refund Process
                </h2>
                <p className="mb-4">
                  Once we receive and inspect your returned item:
                </p>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Refund Timeline</h3>
                    <ul className="text-sm space-y-2">
                      <li>
                        <strong>Inspection:</strong> 1-2 business days after we
                        receive the item
                      </li>
                      <li>
                        <strong>Approval:</strong> Email notification within 24
                        hours of inspection
                      </li>
                      <li>
                        <strong>Processing:</strong> 3-5 business days to
                        process refund
                      </li>
                      <li>
                        <strong>Bank Credit:</strong> 5-10 business days
                        depending on your bank
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Refund Methods</h3>
                    <p className="text-sm mb-2">
                      Refunds will be issued to your original payment method:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>
                        • <strong>Credit/Debit Card:</strong> 5-10 business days
                      </li>
                      <li>
                        • <strong>Online Banking:</strong> 3-5 business days
                      </li>
                      <li>
                        • <strong>e-Wallet:</strong> 1-3 business days
                      </li>
                      <li>
                        • <strong>Store Credit:</strong> Immediate (if
                        requested)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  6. Exchange Policy
                </h2>
                <p className="mb-4">We offer exchanges for:</p>
                <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                  <li>Different size or color of the same product</li>
                  <li>Defective items (replacement with same item)</li>
                  <li>Wrong items sent by our error</li>
                </ul>
                <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                  <strong>Note:</strong> Exchanges are subject to product
                  availability. If the desired item is out of stock, we'll offer
                  a full refund or store credit.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  7. Return Shipping Costs
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Free Return Shipping
                    </h3>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Defective or damaged items</li>
                      <li>• Wrong items sent by our error</li>
                      <li>• Items not matching description</li>
                      <li>• Members with qualifying orders (RM150+)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Customer Pays Shipping
                    </h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Change of mind returns</li>
                      <li>• Size or color exchanges</li>
                      <li>• Non-member returns</li>
                      <li>• Returns outside our error</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  8. Damaged or Defective Items
                </h2>
                <p className="mb-4">
                  If you receive a damaged or defective item:
                </p>
                <ol className="list-decimal list-inside ml-4 space-y-2">
                  <li>Contact us immediately (within 48 hours of delivery)</li>
                  <li>Provide photos of the damaged item and packaging</li>
                  <li>
                    Include your order number and description of the issue
                  </li>
                  <li>We'll arrange immediate replacement or full refund</li>
                  <li>No need to return the damaged item unless requested</li>
                </ol>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-semibold">
                    Quality Guarantee
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    We stand behind the quality of our products. If you're not
                    satisfied with the quality, we'll make it right with a
                    replacement or full refund.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  9. Member Benefits
                </h2>
                <p className="mb-4">
                  JRM E-commerce members enjoy additional return benefits:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Extended 21-day return window on select items</li>
                  <li>Free return shipping on orders over RM150</li>
                  <li>Priority processing for returns and refunds</li>
                  <li>
                    Option for instant store credit instead of waiting for
                    refund
                  </li>
                  <li>Dedicated member support line for returns</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  10. Contact Information
                </h2>
                <p className="mb-4">For return and refund inquiries:</p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Returns Department</strong>
                  </p>
                  <p>JRM E-commerce Sdn Bhd</p>
                  <p>Email: returns@jrm-ecommerce.com</p>
                  <p>Phone: +60 3-1234 5678</p>
                  <p>WhatsApp: +60 12-345 6789</p>
                  <p>Live Chat: Available on our website 9 AM - 6 PM</p>
                  <p>Return Address: [Warehouse Address], Malaysia</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  11. Policy Updates
                </h2>
                <p>
                  We may update this Return & Refund Policy from time to time.
                  Any changes will be posted on this page with the updated
                  effective date. Continued use of our service after changes
                  constitutes acceptance of the revised policy.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            This policy complies with Malaysian Consumer Protection Act 1999 and
            ensures fair treatment for all customers.
          </p>
        </div>
      </div>
    </div>
  );
}
