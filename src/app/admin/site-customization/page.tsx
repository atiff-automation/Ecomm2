'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
import {
  Monitor,
  Palette,
  Camera,
  Image as ImageIcon,
  Video,
  Settings,
  Eye,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function SiteCustomizationOverview() {
  const breadcrumbItems = [
    {
      label: 'Site Customization',
      href: '/admin/site-customization',
      icon: Monitor,
    },
  ];

  const customizationFeatures = [
    {
      title: 'Hero Section',
      description: 'Customize your homepage hero section with custom images, videos, and content',
      icon: Camera,
      href: '/admin/site-customization/hero',
      color: 'blue',
      features: [
        'Upload background images and videos',
        'Edit hero text and call-to-action buttons',
        'Adjust overlay opacity and text alignment',
        'Real-time preview of changes',
      ],
    },
    {
      title: 'Theme Colors',
      description: 'Manage your site\'s color scheme and create custom themes',
      icon: Palette,
      href: '/admin/site-customization/theme',
      color: 'purple',
      features: [
        'Create and manage multiple themes',
        'Live color picker with preview',
        'Duplicate and modify existing themes',
        'Instant theme activation',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation items={breadcrumbItems} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-600" />
            Site Customization
          </h1>
          <p className="text-gray-600 mt-1">
            Customize your website's appearance, content, and branding
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hero Section</p>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Palette className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Theme</p>
                  <p className="text-2xl font-bold text-gray-900">Default</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Media Files</p>
                  <p className="text-2xl font-bold text-gray-900">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customization Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {customizationFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClasses = {
              blue: 'text-blue-600 bg-blue-100 border-blue-200',
              purple: 'text-purple-600 bg-purple-100 border-purple-200',
            };

            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((featureItem, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        {featureItem}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-3 pt-4">
                    <Link href={feature.href} className="flex-1">
                      <Button className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage {feature.title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Getting Started */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Getting Started with Site Customization
                </h3>
                <p className="text-gray-600 mb-4">
                  Personalize your e-commerce site to match your brand identity. 
                  Start with updating your hero section to showcase your products and value proposition, 
                  then customize the color theme to align with your brand colors.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/admin/site-customization/hero">
                    <Button>
                      <Camera className="w-4 h-4 mr-2" />
                      Customize Hero Section
                    </Button>
                  </Link>
                  <Link href="/admin/site-customization/theme">
                    <Button variant="outline">
                      <Palette className="w-4 h-4 mr-2" />
                      Manage Themes
                    </Button>
                  </Link>
                  <Link href="/" target="_blank">
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Site
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}