/**
 * Footer Component - JRM E-commerce Platform
 * Modern, responsive footer with social media links and navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/layout/Container';
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YouTubeIcon,
  TikTokIcon,
  WhatsAppIcon,
  LinkedInIcon,
} from '@/components/icons/SocialIcons';
import { Mail, Phone, MapPin, ShoppingBag, Heart, ArrowUp } from 'lucide-react';

interface FooterProps {
  className?: string;
}

interface BusinessProfile {
  tradingName: string;
  primaryEmail: string;
  supportEmail: string;
  primaryPhone: string;
  secondaryPhone: string | null;
  website: string;
  operationalAddress:
    | string
    | {
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        addressLine1?: string;
        addressLine2?: string;
      };
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch business profile data
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch('/api/business-profile/public');
        const result = await response.json();

        if (result.success && result.data) {
          setBusinessProfile(result.data);
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
        // Keep businessProfile as null to use fallback values
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, []);

  // Helper function to format address
  const formatAddress = (
    address: BusinessProfile['operationalAddress']
  ): string => {
    if (!address) {
      return 'Kuala Lumpur, Malaysia';
    }

    if (typeof address === 'string') {
      return address;
    }

    // Handle object format
    const parts = [
      address.city,
      address.state,
      address.country || 'Malaysia',
    ].filter(part => part && part.trim() !== '');

    return parts.length > 0 ? parts.join(', ') : 'Kuala Lumpur, Malaysia';
  };

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'Featured Products', href: '/products?featured=true' },
        { label: 'On Sale', href: '/products?promotional=true' },
        { label: 'New Arrivals', href: '/products?sort=newest' },
        { label: 'Best Sellers', href: '/products?sort=popular' },
        { label: 'All Products', href: '/products' },
      ],
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Track Your Order', href: '/track-order' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'FAQs', href: '/legal/terms' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'My Account', href: '/member/profile' },
        { label: 'Order History', href: '/member/orders' },
        { label: 'Membership Benefits', href: '/join' },
        { label: 'Sign Up', href: '/auth/signup' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'Agent Program', href: '/apply-agent' },
        { label: 'Privacy Policy', href: '/legal/privacy' },
        { label: 'Terms of Service', href: '/legal/terms' },
      ],
    },
  ];

  const socialLinks = [
    {
      icon: FacebookIcon,
      href: '#',
      label: 'Facebook',
      hoverColor: 'hover:text-blue-600',
    },
    {
      icon: InstagramIcon,
      href: '#',
      label: 'Instagram',
      hoverColor: 'hover:text-pink-600',
    },
    {
      icon: TwitterIcon,
      href: '#',
      label: 'Twitter',
      hoverColor: 'hover:text-blue-400',
    },
    {
      icon: YouTubeIcon,
      href: '#',
      label: 'YouTube',
      hoverColor: 'hover:text-red-600',
    },
    {
      icon: TikTokIcon,
      href: '#',
      label: 'TikTok',
      hoverColor: 'hover:text-black',
    },
    {
      icon: WhatsAppIcon,
      href: '#',
      label: 'WhatsApp',
      hoverColor: 'hover:text-green-600',
    },
    {
      icon: LinkedInIcon,
      href: '#',
      label: 'LinkedIn',
      hoverColor: 'hover:text-blue-700',
    },
  ];

  return (
    <footer
      className={cn(
        'bg-gray-900 text-gray-300 border-t border-gray-800',
        className
      )}
    >
      {/* Main Footer Content */}
      <Container size="xl" className="py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Link href="/" className="flex items-center space-x-2">
                <ShoppingBag className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">
                  {businessProfile?.tradingName || 'JRM E-commerce'}
                </span>
              </Link>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">
              Your trusted Malaysian e-commerce platform offering quality
              products with intelligent membership benefits and local payment
              solutions.
            </p>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <a
                  href={`mailto:${businessProfile?.supportEmail || businessProfile?.primaryEmail || 'support@jrm-ecommerce.com'}`}
                  className="hover:text-white transition-colors"
                >
                  {businessProfile?.supportEmail ||
                    businessProfile?.primaryEmail ||
                    'support@jrm-ecommerce.com'}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <a
                  href={`tel:${(businessProfile?.primaryPhone || '+60123456789').replace(/\s/g, '')}`}
                  className="hover:text-white transition-colors"
                >
                  {businessProfile?.primaryPhone || '+60 12-345 6789'}
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {formatAddress(businessProfile?.operationalAddress)}
                </span>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map(social => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className={cn(
                        'p-2 rounded-lg bg-gray-800 text-gray-400 transition-all duration-200',
                        'hover:bg-gray-700 hover:scale-110',
                        social.hoverColor
                      )}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Sections */}
          {footerSections.map(section => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Newsletter Section */}
      <div className="bg-gray-800 border-t border-gray-700">
        <Container size="xl" className="py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h4 className="text-white font-semibold">Stay Updated</h4>
              </div>
              <p className="text-gray-400 text-sm">
                Subscribe to our newsletter for exclusive deals and new product
                updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[400px]">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900 border-t border-gray-800">
        <Container size="xl" className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-400">
              <p>
                © {currentYear}{' '}
                {businessProfile?.tradingName || 'JRM E-commerce'}. All rights
                reserved.
              </p>
              <div className="flex items-center space-x-4">
                <Link
                  href="/legal/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-gray-600">•</span>
                <Link
                  href="/legal/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
                <span className="text-gray-600">•</span>
                <Link
                  href="/legal/cookies"
                  className="hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 group"
              aria-label="Back to top"
            >
              <span className="text-sm">Back to top</span>
              <ArrowUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;
