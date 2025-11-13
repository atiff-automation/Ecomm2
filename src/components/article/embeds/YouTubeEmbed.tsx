/**
 * YouTube Embed Component
 * Renders YouTube videos with privacy-enhanced mode (GDPR compliant)
 * Features: Responsive 16:9 aspect ratio, lazy loading, accessibility
 */

'use client';

import React from 'react';
import { ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function YouTubeEmbed({
  videoId,
  title = 'YouTube video player',
  className = '',
}: YouTubeEmbedProps) {
  // Validate video ID length
  if (videoId.length !== ARTICLE_CONSTANTS.EMBEDS.YOUTUBE.VIDEO_ID_LENGTH) {
    console.warn(`Invalid YouTube video ID: ${videoId}`);
    return null;
  }

  // Construct privacy-enhanced embed URL
  const embedUrl = `${ARTICLE_CONSTANTS.EMBEDS.YOUTUBE.EMBED_BASE_URL}${videoId}`;
  const iframeAttrs = ARTICLE_CONSTANTS.EMBEDS.YOUTUBE.IFRAME_ATTRIBUTES;

  return (
    <div
      className={`youtube-embed-wrapper my-6 ${className}`}
      style={{
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        maxWidth: '100%',
        borderRadius: '8px',
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow={iframeAttrs.allow}
        allowFullScreen={iframeAttrs.allowFullScreen}
        loading={iframeAttrs.loading}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
        aria-label={title}
      />
    </div>
  );
}
