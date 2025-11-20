/**
 * Custom Body Scripts Component
 * Renders custom scripts at the end of the body section
 * Used for landing pages with custom tracking or functionality
 */

'use client';

import Script from 'next/script';

interface CustomBodyScriptsProps {
  customScripts?: {
    head?: string[];
    body?: string[];
  } | null;
}

export function CustomBodyScripts({ customScripts }: CustomBodyScriptsProps) {
  if (!customScripts?.body || customScripts.body.length === 0) {
    return null;
  }

  return (
    <>
      {customScripts.body.map((script, index) => (
        <Script
          key={`custom-body-${index}`}
          id={`custom-body-script-${index}`}
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}
    </>
  );
}
