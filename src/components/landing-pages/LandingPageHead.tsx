/**
 * Landing Page Head Component
 * Renders enhanced SEO meta tags and tracking scripts for landing pages
 * Designed for use in Next.js App Router with generateMetadata
 */

'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface LandingPageHeadProps {
  // Analytics & Tracking
  fbPixelId?: string | null;
  gaTrackingId?: string | null;
  gtmContainerId?: string | null;
  customScripts?: {
    head?: string[];
    body?: string[];
  } | null;
}

export function LandingPageHead({
  fbPixelId,
  gaTrackingId,
  gtmContainerId,
  customScripts,
}: LandingPageHeadProps) {
  // Initialize Facebook Pixel
  useEffect(() => {
    if (fbPixelId && typeof window !== 'undefined') {
      // @ts-ignore
      window.fbq = window.fbq || function() {
        // @ts-ignore
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      // @ts-ignore
      window.fbq.loaded = true;
      // @ts-ignore
      window.fbq('init', fbPixelId);
      // @ts-ignore
      window.fbq('track', 'PageView');
    }
  }, [fbPixelId]);

  return (
    <>
      {/* Facebook Pixel */}
      {fbPixelId && (
        <>
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Analytics (GA4 or Universal Analytics) */}
      {gaTrackingId && (
        <>
          {gaTrackingId.startsWith('G-') ? (
            // GA4
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
                strategy="afterInteractive"
              />
              <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gaTrackingId}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          ) : (
            // Universal Analytics
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                  ga('create', '${gaTrackingId}', 'auto');
                  ga('send', 'pageview');
                `,
              }}
            />
          )}
        </>
      )}

      {/* Google Tag Manager */}
      {gtmContainerId && (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmContainerId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Custom Head Scripts */}
      {customScripts?.head && customScripts.head.length > 0 && (
        <>
          {customScripts.head.map((script, index) => (
            <Script
              key={`custom-head-${index}`}
              id={`custom-head-script-${index}`}
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{ __html: script }}
            />
          ))}
        </>
      )}
    </>
  );
}
