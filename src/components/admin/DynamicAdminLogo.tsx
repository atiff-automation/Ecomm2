'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BusinessBranding {
  logo: {
    url: string;
    width: number;
    height: number;
  };
}

export function DynamicAdminLogo() {
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await fetch('/api/site-customization/current');
        if (response.ok) {
          const data = await response.json();
          setBranding(data.branding);
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  if (loading) {
    return (
      <Link href="/admin/dashboard" className="flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          <span className="ml-3 text-lg font-semibold text-gray-900">
            Admin
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/admin/dashboard" className="flex items-center">
      <div className="flex items-center">
        {branding?.logo?.url ? (
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-gray-200">
            <Image
              src={branding.logo.url}
              alt="Business Logo"
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
        ) : (
          // Fallback to original JRM logo if no business logo
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">JRM</span>
          </div>
        )}
        <span className="ml-3 text-lg font-semibold text-gray-900">
          Admin
        </span>
      </div>
    </Link>
  );
}