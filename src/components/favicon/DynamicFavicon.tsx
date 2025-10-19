/**
 * Dynamic Favicon Component - Malaysian E-commerce Platform
 * Dynamically updates favicon based on site customization
 */

'use client';

import { useEffect } from 'react';

export function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        // Fetch site customization data
        const response = await fetch('/api/site-customization/current');
        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.branding?.favicon?.url) {
          // Update favicon with custom one
          let link = document.querySelector(
            "link[rel*='icon']"
          ) as HTMLLinkElement;

          if (!link) {
            // Create favicon link if it doesn't exist
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }

          link.href = data.branding.favicon.url;

          // Also update any apple-touch-icon if the same image should be used
          const appleTouchIcon = document.querySelector(
            "link[rel='apple-touch-icon']"
          ) as HTMLLinkElement;
          if (appleTouchIcon) {
            appleTouchIcon.href = data.branding.favicon.url;
          }
        }
      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    updateFavicon();
  }, []);

  return null; // This component doesn't render anything
}
