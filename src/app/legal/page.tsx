/**
 * Legal Information Landing Page - JRM E-commerce Platform
 * Overview of all legal policies and compliance information
 */

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Shield,
  RotateCcw,
  Truck,
  Cookie,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

export default function LegalPage() {
  const legalPages = [
    {
      href: '/legal/terms',
      title: 'Terms of Service',
      icon: FileText,
      description:
        'Complete terms and conditions for using our e-commerce platform, including membership program details and user obligations.',
      lastUpdated: 'August 6, 2025',
      importance: 'Essential',
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      href: '/legal/privacy',
      title: 'Privacy Policy',
      icon: Shield,
      description:
        'Comprehensive privacy policy compliant with Malaysian PDPA, explaining how we collect, use, and protect your personal data.',
      lastUpdated: 'August 6, 2025',
      importance: 'Essential',
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      href: '/legal/returns',
      title: 'Return & Refund Policy',
      icon: RotateCcw,
      description:
        '14-day return policy, refund process, and exchange procedures compliant with Malaysian Consumer Protection Act.',
      lastUpdated: 'August 6, 2025',
      importance: 'Important',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      href: '/legal/shipping',
      title: 'Shipping Policy',
      icon: Truck,
      description:
        'Detailed shipping information, delivery timeframes, costs, and terms for Malaysian nationwide delivery via EasyParcel.',
      lastUpdated: 'August 6, 2025',
      importance: 'Important',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      href: '/legal/cookies',
      title: 'Cookie Policy',
      icon: Cookie,
      description:
        'Information about cookies and tracking technologies we use, with options to manage your preferences.',
      lastUpdated: 'August 6, 2025',
      importance: 'Informational',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const complianceInfo = [
    {
      title: 'Malaysian PDPA Compliance',
      description: 'Full compliance with Personal Data Protection Act 2010',
      icon: CheckCircle,
      status: 'Compliant',
    },
    {
      title: 'Consumer Protection Act 1999',
      description:
        'Return and refund policies comply with Malaysian consumer law',
      icon: CheckCircle,
      status: 'Compliant',
    },
    {
      title: 'E-Commerce Regulations',
      description:
        'Adherence to Malaysian e-commerce guidelines and best practices',
      icon: CheckCircle,
      status: 'Compliant',
    },
    {
      title: 'International Standards',
      description:
        'GDPR-ready privacy practices and international e-commerce standards',
      icon: Info,
      status: 'Aligned',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          Legal Information & Policies
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Comprehensive legal documentation for JRM E-commerce platform,
          ensuring transparency, compliance with Malaysian laws, and protection
          of your rights as our customer.
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Important Legal Notice
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                By using our platform, you agree to these terms and policies. We
                recommend reading through all policies, especially our Terms of
                Service and Privacy Policy. These documents are regularly
                updated to ensure compliance with current laws and to serve you
                better.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Policies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-6">
        {legalPages.map(page => {
          const IconComponent = page.icon;
          return (
            <Card key={page.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Last updated: {page.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <Badge className={page.badgeColor}>{page.importance}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {page.description}
                </p>
                <Link
                  href={page.href}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read Full Policy →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Legal Compliance & Standards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {complianceInfo.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 border rounded-lg"
                >
                  <IconComponent className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Information */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-2">Comprehensive Coverage</h3>
            <p className="text-sm text-gray-600">
              All aspects of our business relationship are clearly documented
              and legally compliant.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-2">Privacy Protected</h3>
            <p className="text-sm text-gray-600">
              Your personal data is protected under Malaysian PDPA and
              international privacy standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-2">Regularly Updated</h3>
            <p className="text-sm text-gray-600">
              Our policies are reviewed and updated regularly to ensure current
              legal compliance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Questions About Our Policies?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Legal Department</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong> legal@jrm-ecommerce.com
                </p>
                <p>
                  <strong>Phone:</strong> +60 3-1234 5678
                </p>
                <p>
                  <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM
                </p>
                <p>
                  <strong>Response Time:</strong> Within 48 hours
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Privacy Inquiries</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Data Protection Officer:</strong>{' '}
                  privacy@jrm-ecommerce.com
                </p>
                <p>
                  <strong>PDPA Requests:</strong> Processed within 21 days
                </p>
                <p>
                  <strong>Cookie Preferences:</strong> Manage through website
                  settings
                </p>
                <p>
                  <strong>Complaints:</strong> Via customer support or
                  regulatory authorities
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated Notice */}
      <div className="text-center py-6 border-t">
        <p className="text-sm text-gray-500">
          All policies were last reviewed and updated on August 6, 2025. We will
          notify you of any material changes via email or website notification.
        </p>
      </div>
    </div>
  );
}
