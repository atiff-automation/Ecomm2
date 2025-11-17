/**
 * LandingPage Content Component
 * Renders landingPage content with embedded YouTube videos and product cards
 * Single Source of Truth for landingPage content display
 */

'use client';

import React from 'react';

interface LandingPageContentProps {
  content: string;
  className?: string;
}

/**
 * LandingPage Content Renderer
 * Displays transformed HTML content with embeds
 * Content should be pre-transformed on server-side for performance
 */
export function LandingPageContent({
  content,
  className = '',
}: LandingPageContentProps) {
  return (
    <div
      className={`landingPage-content prose prose-sm sm:prose md:prose-lg max-w-none break-words hyphens-auto prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
