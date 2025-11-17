'use client';

import { useCallback, useEffect } from 'react';

/**
 * Click Type for Landing Page Tracking
 */
export type ClickType = 'PRODUCT' | 'CTA' | 'EXTERNAL_LINK';

/**
 * Click Tracking Data
 */
export interface TrackClickData {
  clickType: ClickType;
  targetUrl?: string;
  targetId?: string; // Product ID for product clicks
}

/**
 * Landing Page Tracking Hook
 *
 * Provides functions to track views and clicks on landing pages
 * Automatically extracts UTM parameters from URL
 *
 * @param slug - Landing page slug
 * @returns Tracking functions
 */
export function useLandingPageTracking(slug: string) {
  /**
   * Get UTM Parameters from URL
   */
  const getUTMParams = useCallback(() => {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
    };
  }, []);

  /**
   * Get or Create Session ID
   */
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return undefined;

    let sessionId = sessionStorage.getItem('landing_page_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      sessionStorage.setItem('landing_page_session_id', sessionId);
    }
    return sessionId;
  }, []);

  /**
   * Track Page View
   */
  const trackView = useCallback(async () => {
    try {
      await fetch(`/api/public/landing-pages/${slug}/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[useLandingPageTracking] Failed to track view:', error);
    }
  }, [slug]);

  /**
   * Track Click Event
   */
  const trackClick = useCallback(
    async (clickData: TrackClickData) => {
      try {
        await fetch(`/api/public/landing-pages/${slug}/track-click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...clickData,
            sessionId: getSessionId(),
            ...getUTMParams(),
          }),
        });
      } catch (error) {
        console.error('[useLandingPageTracking] Failed to track click:', error);
      }
    },
    [slug, getSessionId, getUTMParams]
  );

  /**
   * Auto-track view on mount
   */
  useEffect(() => {
    trackView();
  }, [trackView]);

  return {
    trackView,
    trackClick,
  };
}
