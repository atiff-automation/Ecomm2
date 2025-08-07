/**
 * SEO Head Component - JRM E-commerce Platform
 * Client-side structured data injection for App Router
 */

'use client';

import React, { useEffect } from 'react';
import { SEOData } from '@/lib/seo/seo-service';

interface SEOHeadProps {
  seo: SEOData;
}

export default function SEOHead({ seo }: SEOHeadProps) {
  useEffect(() => {
    // Add structured data to document head
    if (seo.structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(seo.structuredData);
      document.head.appendChild(script);

      return () => {
        // Cleanup: remove script when component unmounts
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }

    return undefined; // Explicit return for all code paths
  }, [seo.structuredData]);

  return null; // This component doesn't render anything visible
}
