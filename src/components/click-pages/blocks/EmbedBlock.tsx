'use client';

/**
 * Embed Block Component
 * Generic iframe embed for external content
 * Supports custom HTML embed codes and iframe URLs
 */

import type { EmbedBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';

interface EmbedBlockComponentProps {
  block: EmbedBlock;
}

const WIDTH_MAP = {
  full: 'w-full',
  large: 'max-w-5xl mx-auto',
  medium: 'max-w-3xl mx-auto',
  small: 'max-w-xl mx-auto',
};

export function EmbedBlockComponent({ block }: EmbedBlockComponentProps) {
  const { settings } = block;

  const getWidth = (): string => {
    if (typeof settings.width === 'number') {
      return `max-w-[${settings.width}px]`;
    }
    return WIDTH_MAP[settings.width];
  };

  if (!settings.iframeUrl && !settings.embedCode) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 dark:text-gray-400">No embed source configured</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', getWidth())}>
      {settings.title && (
        <h3 className="text-xl font-semibold mb-3">{settings.title}</h3>
      )}

      <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {settings.embedType === 'iframe' && settings.iframeUrl ? (
          <iframe
            src={settings.iframeUrl}
            title={settings.title || 'Embedded content'}
            width="100%"
            height={settings.height}
            allowFullScreen={settings.allowFullscreen}
            allow={settings.allowScripts ? 'scripts' : undefined}
            className="w-full border-0"
            style={{ height: `${settings.height}px` }}
          />
        ) : settings.embedCode ? (
          <div
            className="w-full"
            style={{ minHeight: `${settings.height}px` }}
            dangerouslySetInnerHTML={{ __html: settings.embedCode }}
          />
        ) : null}
      </div>

      {settings.caption && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
          {settings.caption}
        </p>
      )}
    </div>
  );
}

export default EmbedBlockComponent;
