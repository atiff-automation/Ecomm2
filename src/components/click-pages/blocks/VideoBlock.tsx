'use client';

/**
 * Video Block Component
 * Embed YouTube, Vimeo, or self-hosted video
 * Supports multiple video sources and aspect ratios
 * Auto-plays when video comes into viewport
 */

import { useEffect, useRef } from 'react';
import type { VideoBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface VideoBlockComponentProps {
  block: VideoBlock;
}

const ASPECT_RATIO_MAP = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '21:9': 'aspect-[21/9]',
  'auto': null, // Natural video dimensions - no aspect ratio constraint
};

export function VideoBlockComponent({ block }: VideoBlockComponentProps) {
  const { settings } = block;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getVideoEmbedUrl = (): string | null => {
    switch (settings.videoType) {
      case 'youtube':
        if (!settings.youtubeId) return null;
        const ytParams = new URLSearchParams({
          autoplay: settings.autoplay ? '1' : '0',
          loop: settings.loop ? '1' : '0',
          muted: settings.muted ? '1' : '0',
          controls: settings.controls ? '1' : '0',
        });
        return `https://www.youtube.com/embed/${settings.youtubeId}?${ytParams.toString()}`;

      case 'vimeo':
        if (!settings.vimeoId) return null;
        const vimeoParams = new URLSearchParams({
          autoplay: settings.autoplay ? '1' : '0',
          loop: settings.loop ? '1' : '0',
          muted: settings.muted ? '1' : '0',
        });
        return `https://player.vimeo.com/video/${settings.vimeoId}?${vimeoParams.toString()}`;

      case 'self-hosted':
        return settings.selfHostedUrl || null;

      default:
        return null;
    }
  };

  // Intersection Observer for autoplay when video comes into view
  useEffect(() => {
    if (!settings.autoplay || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in viewport
            if (videoRef.current && settings.videoType === 'self-hosted') {
              // For self-hosted videos, programmatically play
              videoRef.current.play().catch((error) => {
                console.log('Autoplay prevented:', error);
              });
            }
          } else {
            // Video is out of viewport - pause if autoplay is enabled
            if (videoRef.current && settings.videoType === 'self-hosted' && settings.autoplay) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of video is visible
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [settings.autoplay, settings.videoType]);

  const embedUrl = getVideoEmbedUrl();

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 dark:text-gray-400">No video source configured</p>
      </div>
    );
  }

  return (
    <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.VIDEO, settings.fullWidth)}>
      {settings.caption && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
          {settings.caption}
        </p>
      )}

      <div
        ref={containerRef}
        className={cn(
          'w-full relative overflow-hidden bg-black',
          settings.rounded === true && 'rounded-lg', // Only apply rounded if explicitly set to true
          settings.aspectRatio === 'auto'
            ? '' // No aspect ratio constraint - video uses natural dimensions
            : ASPECT_RATIO_MAP[settings.aspectRatio]
        )}
      >
        {settings.videoType === 'self-hosted' ? (
          <video
            ref={videoRef}
            src={embedUrl}
            poster={settings.thumbnailUrl}
            controls={settings.controls}
            loop={settings.loop}
            muted={settings.muted || settings.autoplay} // Must be muted for autoplay to work
            playsInline // Required for iOS autoplay
            preload="metadata"
            className={
              settings.aspectRatio === 'auto'
                ? 'w-full h-auto' // Natural dimensions for auto aspect ratio
                : 'absolute inset-0 w-full h-full object-contain'
            }
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            title={settings.caption || 'Video embed'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={
              settings.aspectRatio === 'auto'
                ? 'w-full h-auto min-h-[300px]' // Natural dimensions with minimum height
                : 'absolute inset-0 w-full h-full'
            }
          />
        )}
      </div>
    </div>
  );
}

export default VideoBlockComponent;
