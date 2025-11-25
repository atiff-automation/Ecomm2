'use client';

/**
 * Click Page Viewer Client Component
 * Renders blocks and handles click tracking with theme styling
 */

import { useEffect, useCallback } from 'react';
import { BlockRenderer } from '@/components/click-pages/blocks';
import type { Block } from '@/types/click-page.types';
import type { ThemeSettings } from '@/types/click-page-styles.types';

interface TrackingScript {
  type: 'facebook' | 'google-analytics' | 'gtm';
  id: string;
}

interface ClickPageViewerProps {
  clickPageId: string;
  slug: string;
  blocks: Block[];
  themeSettings?: ThemeSettings;
  trackingScripts: TrackingScript[];
}

/**
 * Get session ID from cookie or generate new one
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const cookieName = 'click_page_session';
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return value;
    }
  }

  // Generate new session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set cookie (expires in 30 minutes)
  const expires = new Date(Date.now() + 30 * 60 * 1000).toUTCString();
  document.cookie = `${cookieName}=${sessionId}; expires=${expires}; path=/`;

  return sessionId;
}

/**
 * Get UTM parameters from URL
 */
function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);

  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

export function ClickPageViewer({
  slug,
  blocks,
  themeSettings,
  trackingScripts,
}: ClickPageViewerProps) {
  // Initialize tracking scripts
  useEffect(() => {
    trackingScripts.forEach((script) => {
      if (script.type === 'facebook' && script.id) {
        // Facebook Pixel
        const fbScript = document.createElement('script');
        fbScript.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${script.id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(fbScript);
      }

      if (script.type === 'google-analytics' && script.id) {
        // Google Analytics
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${script.id}`;
        document.head.appendChild(gaScript);

        const gaInit = document.createElement('script');
        gaInit.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${script.id}');
        `;
        document.head.appendChild(gaInit);
      }

      if (script.type === 'gtm' && script.id) {
        // Google Tag Manager
        const gtmScript = document.createElement('script');
        gtmScript.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${script.id}');
        `;
        document.head.appendChild(gtmScript);
      }
    });
  }, [trackingScripts]);

  // Handle block click tracking
  const handleBlockClick = useCallback(
    async (blockId: string, blockType: string, targetUrl?: string) => {
      try {
        const sessionId = getSessionId();
        const utmParams = getUtmParams();

        await fetch(`/api/public/click-pages/${slug}/track/click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blockId,
            blockType,
            targetUrl,
            sessionId,
            ...utmParams,
          }),
        });
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    },
    [slug]
  );

  return (
    <main className="min-h-screen">
      <BlockRenderer
        blocks={blocks}
        themeSettings={themeSettings}
        onBlockClick={handleBlockClick}
        clickPageSlug={slug}
      />
    </main>
  );
}

export default ClickPageViewer;
