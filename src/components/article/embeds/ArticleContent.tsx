/**
 * Article Content Component
 * Renders article content with embedded YouTube videos and product cards
 * Single Source of Truth for article content display
 */

'use client';

import React from 'react';

interface ArticleContentProps {
  content: string;
  className?: string;
}

/**
 * Article Content Renderer
 * Displays transformed HTML content with embeds
 * Content should be pre-transformed on server-side for performance
 */
export function ArticleContent({
  content,
  className = '',
}: ArticleContentProps) {
  return (
    <div
      className={`prose prose-sm sm:prose md:prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
