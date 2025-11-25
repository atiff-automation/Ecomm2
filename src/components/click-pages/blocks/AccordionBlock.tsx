'use client';

/**
 * Accordion Block Component
 * Collapsible FAQ or content sections
 * Supports multiple items with customizable icons
 */

import type { AccordionBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface AccordionBlockComponentProps {
  block: AccordionBlock;
}

export function AccordionBlockComponent({ block }: AccordionBlockComponentProps) {
  const { settings } = block;
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(settings.items.filter((item) => item.isOpenByDefault).map((item) => item.id))
  );

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        if (!settings.allowMultipleOpen) {
          newSet.clear();
        }
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (!settings.items || settings.items.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 dark:text-gray-400">No accordion items added</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-2', getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.ACCORDION))}>
      {settings.items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div
            key={item.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 text-left',
                'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
              )}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-lg pr-4">{item.title}</span>

              {settings.showIcons && (
                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              )}
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all',
                isOpen ? 'max-h-[2000px]' : 'max-h-0'
              )}
              style={{
                transitionDuration: `${settings.animationDuration}ms`,
              }}
            >
              <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AccordionBlockComponent;
