/**
 * Shipping Policy Page - JRM E-commerce Platform
 * Malaysian Shipping Information and Policies
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Shipping Policy</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              <strong>Effective Date:</strong> August 6, 2025
              <br />
              <strong>Last Updated:</strong> August 6, 2025
              <br />
              <strong>Shipping Partner:</strong> EasyParcel Malaysia
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  1. Shipping Overview
                </h2>
                <p className="mb-4">
                  JRM E-commerce partners with EasyParcel to provide reliable
                  and affordable shipping throughout Malaysia. We offer various
                  shipping options to meet your delivery needs and timeline
                  preferences.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-800 mb-2">
                    Free Shipping Available
                  </p>
                  <p className="text-blue-700 text-sm">
                    Enjoy free shipping on orders over RM150 within Peninsular
                    Malaysia, and RM200 for East Malaysia.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  2. Delivery Areas
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-green-600" />
                      Peninsular Malaysia
                    </h3>
                    <p className="text-sm mb-2">
                      <strong>Coverage:</strong> All states including Kuala
                      Lumpur, Selangor, Penang, Johor, etc.
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Delivery Time:</strong> 1-3 business days
                    </p>
                    <p className="text-sm">
                      <strong>Free Shipping:</strong> Orders above RM150
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-orange-600" />
                      East Malaysia
                    </h3>
                    <p className="text-sm mb-2">
                      <strong>Coverage:</strong> Sabah, Sarawak, and Labuan
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Delivery Time:</strong> 3-7 business days
                    </p>
                    <p className="text-sm">
                      <strong>Free Shipping:</strong> Orders above RM200
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  3. Delivery Timeframes
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-semibold text-green-800">
                      Standard Delivery
                    </h3>
                    <p className="text-green-700 text-sm mt-1">
                      <strong>Peninsular Malaysia:</strong> 2-3 business days |
                      <strong> East Malaysia:</strong> 4-6 business days
                    </p>
                    <p className="text-green-600 text-sm mt-2">
                      Most economical option with reliable service
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold text-blue-800">
                      Express Delivery
                    </h3>
                    <p className="text-blue-700 text-sm mt-1">
                      <strong>Peninsular Malaysia:</strong> 1-2 business days |
                      <strong> East Malaysia:</strong> 2-4 business days
                    </p>
                    <p className="text-blue-600 text-sm mt-2">
                      Faster delivery for urgent orders (additional charges
                      apply)
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h3 className="font-semibold text-purple-800">
                      Same-Day Delivery
                    </h3>
                    <p className="text-purple-700 text-sm mt-1">
                      <strong>Available in:</strong> Klang Valley (KL, Selangor
                      selected areas)
                    </p>
                    <p className="text-purple-600 text-sm mt-2">
                      Orders placed before 12 PM, delivered by 6 PM
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  4. Shipping Costs
                </h2>

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-3">
                    Peninsular Malaysia
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">
                            Weight
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Standard
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Express
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Same-Day
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Up to 1kg
                          </td>
                          <td className="border border-gray-300 p-2">RM8.90</td>
                          <td className="border border-gray-300 p-2">
                            RM12.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM15.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">1-3kg</td>
                          <td className="border border-gray-300 p-2">
                            RM12.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM16.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM19.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">3-5kg</td>
                          <td className="border border-gray-300 p-2">
                            RM16.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM22.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM25.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">5-10kg</td>
                          <td className="border border-gray-300 p-2">
                            RM22.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM29.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM35.90
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">East Malaysia</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">
                            Weight
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Standard
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Express
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">
                            Up to 1kg
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM15.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM22.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">1-3kg</td>
                          <td className="border border-gray-300 p-2">
                            RM19.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM28.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">3-5kg</td>
                          <td className="border border-gray-300 p-2">
                            RM25.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM35.90
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">5-10kg</td>
                          <td className="border border-gray-300 p-2">
                            RM35.90
                          </td>
                          <td className="border border-gray-300 p-2">
                            RM45.90
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  5. Order Processing
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Processing Timeline</h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        • <strong>Standard Orders:</strong> 1-2 business days
                      </li>
                      <li>
                        • <strong>Member Orders:</strong> Priority processing
                        (same day if ordered before 2 PM)
                      </li>
                      <li>
                        • <strong>Custom/Personalized Items:</strong> 3-5
                        business days
                      </li>
                      <li>
                        • <strong>Pre-orders:</strong> As per product
                        availability date
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Order Cut-off Times</h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        • <strong>Same-day processing:</strong> Order by 2:00 PM
                        (Monday-Friday)
                      </li>
                      <li>
                        • <strong>Same-day delivery:</strong> Order by 12:00 PM
                        (Klang Valley only)
                      </li>
                      <li>
                        • <strong>Weekend orders:</strong> Processed on next
                        business day
                      </li>
                      <li>
                        • <strong>Public holidays:</strong> Processing resumes
                        on next working day
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  6. Packaging & Handling
                </h2>
                <p className="mb-4">
                  We take great care in packaging your orders:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>Protective Packaging:</strong> Bubble wrap, air
                    cushions, or foam padding for fragile items
                  </li>
                  <li>
                    <strong>Eco-Friendly Materials:</strong> Recyclable boxes
                    and minimal plastic use
                  </li>
                  <li>
                    <strong>Weather Protection:</strong> Waterproof packaging
                    for electronics and sensitive items
                  </li>
                  <li>
                    <strong>Secure Sealing:</strong> Tamper-evident tape and
                    secure closure methods
                  </li>
                  <li>
                    <strong>Fragile Item Handling:</strong> Special "FRAGILE"
                    labels and extra padding
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  7. Delivery Process
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-semibold mb-2">Tracking Your Order</h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        • Tracking number sent via email and SMS upon dispatch
                      </li>
                      <li>
                        • Real-time tracking available on our website and app
                      </li>
                      <li>
                        • Delivery notifications and estimated time updates
                      </li>
                      <li>
                        • Delivery attempt notifications and rescheduling
                        options
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h3 className="font-semibold mb-2">Delivery Attempts</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Up to 3 delivery attempts at no extra charge</li>
                      <li>• Delivery between 9 AM - 6 PM on business days</li>
                      <li>• Contact recipient before delivery attempt</li>
                      <li>• Option to reschedule delivery or arrange pickup</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  8. Special Delivery Instructions
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Address Requirements</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Provide complete address with postal code</li>
                      <li>• Include apartment/unit number and building name</li>
                      <li>• Add landmarks or special delivery instructions</li>
                      <li>
                        • Ensure contact number is reachable during delivery
                        hours
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Restricted Areas</h3>
                    <p className="text-sm mb-2">
                      We may not be able to deliver to:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Remote areas without proper road access</li>
                      <li>• Military installations or restricted zones</li>
                      <li>• P.O. Boxes (physical address required)</li>
                      <li>
                        • Areas with ongoing construction or road closures
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  9. Delivery Issues
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">
                      Lost or Damaged Packages
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>• Report within 48 hours of expected delivery</li>
                      <li>• Full refund or replacement guarantee</li>
                      <li>• Investigation with shipping partner</li>
                      <li>• Compensation for inconvenience</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Failed Delivery</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Notification via SMS and email</li>
                      <li>• Option to reschedule delivery</li>
                      <li>• Pickup from designated location</li>
                      <li>• Return to sender after 7 days</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  10. Member Shipping Benefits
                </h2>
                <p className="mb-4">
                  JRM E-commerce members enjoy exclusive shipping perks:
                </p>
                <div className="bg-gold-50 p-4 rounded-lg border border-yellow-200">
                  <ul className="text-sm space-y-2">
                    <li>
                      ✨ <strong>Free shipping threshold reduced:</strong> RM120
                      for Peninsular Malaysia
                    </li>
                    <li>
                      ✨ <strong>Priority processing:</strong> Orders processed
                      within 24 hours
                    </li>
                    <li>
                      ✨ <strong>Express upgrade:</strong> Free express shipping
                      on orders over RM300
                    </li>
                    <li>
                      ✨ <strong>Flexible delivery:</strong> Choose preferred
                      delivery time slots
                    </li>
                    <li>
                      ✨ <strong>Extended holding:</strong> Packages held at
                      pickup points for up to 14 days
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  11. International Shipping
                </h2>
                <p className="mb-4 text-gray-600">
                  Currently, we only ship within Malaysia. International
                  shipping may be available in the future. Sign up for our
                  newsletter to be notified when international shipping becomes
                  available.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  12. Contact Information
                </h2>
                <p className="mb-4">For shipping-related inquiries:</p>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Shipping Department</strong>
                  </p>
                  <p>JRM E-commerce Sdn Bhd</p>
                  <p>Email: shipping@jrm-ecommerce.com</p>
                  <p>Phone: +60 3-1234 5678</p>
                  <p>WhatsApp: +60 12-345 6789</p>
                  <p>Live Chat: Available 9 AM - 6 PM (Monday-Friday)</p>
                  <p>Tracking Support: Available 24/7 on website</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">
                  13. Policy Updates
                </h2>
                <p>
                  Shipping costs, delivery timeframes, and policies may change
                  due to seasonal demand, carrier updates, or other factors. Any
                  significant changes will be communicated through email
                  notifications and website updates. Current shipping rates are
                  always displayed at checkout.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            We're committed to providing reliable and affordable shipping
            throughout Malaysia.
          </p>
        </div>
      </div>
    </div>
  );
}
