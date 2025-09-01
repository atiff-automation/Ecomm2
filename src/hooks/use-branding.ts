/**
 * Branding Hook - Malaysian E-commerce Platform
 * Hook to fetch and manage site branding assets (logo, favicon)
 */

'use client';

import { useState, useEffect } from 'react';

interface BrandingAssets {
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  faviconUrl?: string;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingAssets>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranding();
    
    // Listen for branding updates from admin panel
    const handleBrandingUpdate = () => {
      setTimeout(() => {
        fetchBranding();
      }, 1000); // Wait 1 second to ensure API is updated
    };
    
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate);
    };
  }, []);

  const fetchBranding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch branding from API
      const response = await fetch('/api/branding/current');
      if (!response.ok) {
        throw new Error('Failed to fetch branding');
      }
      
      const data = await response.json();
      setBranding({
        logoUrl: data.logoUrl || undefined,
        logoWidth: data.logoWidth || undefined,
        logoHeight: data.logoHeight || undefined,
        faviconUrl: data.faviconUrl || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branding');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update branding (can be called after upload)
  const updateBranding = (newBranding: Partial<BrandingAssets>) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
    
    // Refetch from API to get latest data after a brief delay
    setTimeout(() => {
      fetchBranding();
    }, 500);
  };

  return {
    branding,
    isLoading,
    error,
    updateBranding,
    refetch: fetchBranding,
  };
}