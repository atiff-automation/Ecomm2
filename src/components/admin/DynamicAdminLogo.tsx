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
      <Link href="/admin/dashboard" className="flex justify-center items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
      </Link>
    );
  }

  return (
    <Link href="/admin/dashboard" className="flex justify-center items-center">
      {branding?.logo?.url ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
          <Image
            src={branding.logo.url}
            alt="Business Logo"
            fill
            className="object-contain"
            sizes="64px"
          />
        </div>
      ) : (
        // Fallback to original JRM logo if no business logo
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-2xl">JRM</span>
        </div>
      )}
    </Link>
  );
}