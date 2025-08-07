/**
 * Legal Pages Layout - JRM E-commerce Platform
 * Consistent layout for all legal/policy pages
 */

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Shield, RotateCcw, Truck, Cookie } from 'lucide-react';

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  const legalPages = [
    {
      href: '/legal/terms',
      title: 'Terms of Service',
      icon: FileText,
      description: 'Terms and conditions for using our platform'
    },
    {
      href: '/legal/privacy',
      title: 'Privacy Policy',
      icon: Shield,
      description: 'How we protect and handle your personal data'
    },
    {
      href: '/legal/returns',
      title: 'Return & Refund Policy',
      icon: RotateCcw,
      description: 'Return, refund, and exchange policies'
    },
    {
      href: '/legal/shipping',
      title: 'Shipping Policy',
      icon: Truck,
      description: 'Delivery information and shipping terms'
    },
    {
      href: '/legal/cookies',
      title: 'Cookie Policy',
      icon: Cookie,
      description: 'How we use cookies and tracking technologies'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              ← Back to JRM E-commerce
            </Link>
            <div className="text-sm text-gray-600">
              Legal Information & Policies
            </div>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 text-gray-900">Legal Information</h3>
                <nav className="space-y-2">
                  {legalPages.map((page) => {
                    const IconComponent = page.icon;
                    return (
                      <Link
                        key={page.href}
                        href={page.href}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <IconComponent className="h-4 w-4 mt-0.5 text-gray-500 group-hover:text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                            {page.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {page.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Contact Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Email: legal@jrm-ecommerce.com</p>
                    <p>Phone: +60 3-1234 5678</p>
                    <p>Business Hours: 9 AM - 6 PM</p>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Quick Links</h4>
                  <div className="space-y-2">
                    <Link href="/support" className="block text-sm text-blue-600 hover:text-blue-800">
                      Customer Support
                    </Link>
                    <Link href="/faq" className="block text-sm text-blue-600 hover:text-blue-800">
                      FAQ
                    </Link>
                    <Link href="/contact" className="block text-sm text-blue-600 hover:text-blue-800">
                      Contact Us
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              These policies are effective as of August 6, 2025 and comply with Malaysian laws and international standards.
            </p>
            <p>
              © 2025 JRM E-commerce Sdn Bhd. All rights reserved. | 
              <Link href="/legal/terms" className="text-blue-600 hover:underline ml-1">Terms</Link> | 
              <Link href="/legal/privacy" className="text-blue-600 hover:underline ml-1">Privacy</Link> | 
              <Link href="/legal/cookies" className="text-blue-600 hover:underline ml-1">Cookies</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}