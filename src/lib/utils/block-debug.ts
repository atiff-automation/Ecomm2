/**
 * Block Debug Utilities
 *
 * Browser console debugging for click page blocks.
 * Helps diagnose React hydration errors and state issues.
 *
 * USAGE:
 * In browser console:
 *   localStorage.setItem('DEBUG_BLOCKS', 'true');  // Enable
 *   location.reload();                              // Reload page
 *   localStorage.removeItem('DEBUG_BLOCKS');        // Disable
 */

import type { Block } from '@/types/click-page.types';

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('DEBUG_BLOCKS') === 'true';
}

/**
 * Debug log with emoji prefix
 */
function debugLog(emoji: string, label: string, ...args: unknown[]) {
  if (!isDebugEnabled()) return;
  console.log(`${emoji} [BLOCKS] ${label}`, ...args);
}

/**
 * Debug group for related logs
 */
function debugGroup(emoji: string, label: string, callback: () => void) {
  if (!isDebugEnabled()) return;
  console.group(`${emoji} [BLOCKS] ${label}`);
  callback();
  console.groupEnd();
}

/**
 * Log block creation
 */
export function debugBlockCreation(type: string, block: Block) {
  debugGroup('➕', `Creating ${type} block`, () => {
    console.log('Block ID:', block.id);
    console.log('Sort Order:', block.sortOrder);
    console.log('Settings:', block.settings);

    // Check for rounded property specifically
    if ('rounded' in (block.settings as { rounded?: boolean })) {
      const rounded = (block.settings as { rounded?: boolean }).rounded;
      console.log('🔘 Rounded property:', rounded, `(type: ${typeof rounded})`);
    } else {
      console.warn('⚠️  Rounded property missing!');
    }
  });
}

/**
 * Log block update
 */
export function debugBlockUpdate(blockId: string, updates: Partial<Block>) {
  debugGroup('✏️', `Updating block ${blockId}`, () => {
    console.log('Updates:', updates);

    if (updates.settings) {
      console.log('Settings changes:', updates.settings);

      // Check for rounded property in updates
      if ('rounded' in (updates.settings as { rounded?: boolean })) {
        const rounded = (updates.settings as { rounded?: boolean }).rounded;
        console.log('🔘 Rounded changed to:', rounded, `(type: ${typeof rounded})`);
      }
    }
  });
}

/**
 * Log block state changes
 */
export function debugBlockState(action: string, prevBlocks: Block[], nextBlocks: Block[]) {
  debugGroup('📊', `State change: ${action}`, () => {
    console.log('Previous blocks:', prevBlocks.length);
    console.log('Next blocks:', nextBlocks.length);

    // Find differences
    if (prevBlocks.length !== nextBlocks.length) {
      console.log('🔢 Block count changed:', {
        before: prevBlocks.length,
        after: nextBlocks.length,
        diff: nextBlocks.length - prevBlocks.length,
      });
    }

    // Check for new blocks
    const newBlocks = nextBlocks.filter(
      (next) => !prevBlocks.find((prev) => prev.id === next.id)
    );

    if (newBlocks.length > 0) {
      console.log('🆕 New blocks:', newBlocks.map((b) => ({
        id: b.id,
        type: b.type,
        rounded: (b.settings as { rounded?: boolean }).rounded,
      })));
    }

    // Check for removed blocks
    const removedBlocks = prevBlocks.filter(
      (prev) => !nextBlocks.find((next) => next.id === prev.id)
    );

    if (removedBlocks.length > 0) {
      console.log('🗑️  Removed blocks:', removedBlocks.map((b) => b.id));
    }

    // Check for updated blocks
    const updatedBlocks = nextBlocks.filter((next) => {
      const prev = prevBlocks.find((p) => p.id === next.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(next);
    });

    if (updatedBlocks.length > 0) {
      console.log('🔄 Updated blocks:', updatedBlocks.map((b) => ({
        id: b.id,
        type: b.type,
      })));
    }
  });
}

/**
 * Log hydration check
 */
export function debugHydrationCheck(blocks: Block[]) {
  if (!isDebugEnabled()) return;

  const issues: string[] = [];

  blocks.forEach((block, index) => {
    // Check for undefined rounded in IMAGE, VIDEO, IMAGE_GALLERY blocks
    if (['IMAGE', 'VIDEO', 'IMAGE_GALLERY'].includes(block.type)) {
      const settings = block.settings as { rounded?: boolean };

      if (settings.rounded === undefined) {
        issues.push(`Block ${index + 1} (${block.type}, ID: ${block.id}): rounded is undefined`);
      } else if (settings.rounded === null) {
        issues.push(`Block ${index + 1} (${block.type}, ID: ${block.id}): rounded is null`);
      }
    }
  });

  if (issues.length > 0) {
    debugGroup('⚠️', 'Potential hydration issues detected', () => {
      issues.forEach((issue) => console.warn(issue));
      console.log('💡 Tip: Run migration script to fix: npx tsx scripts/fix-rounded-property.ts');
    });
  } else {
    debugLog('✅', 'No hydration issues detected in blocks');
  }
}

/**
 * Log error details
 */
export function debugError(error: Error, context?: string) {
  if (!isDebugEnabled()) return;

  debugGroup('❌', `Error${context ? ` in ${context}` : ''}`, () => {
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    if (error.message.includes('#185')) {
      console.warn('🔍 React Error #185 - Hydration Mismatch');
      console.warn('This usually means server/client rendered different content');
      console.warn('Check for:');
      console.warn('  - undefined vs false/true values');
      console.warn('  - null vs undefined');
      console.warn('  - missing properties on some blocks');
    }
  });
}

/**
 * Log save operation
 */
export function debugSaveOperation(blocks: Block[], payload: unknown) {
  debugGroup('💾', 'Saving click page', () => {
    console.log('Total blocks:', blocks.length);
    console.log('Payload:', payload);

    // Check all blocks have proper rounded property
    const imageBlocks = blocks.filter((b) =>
      ['IMAGE', 'VIDEO', 'IMAGE_GALLERY'].includes(b.type)
    );

    if (imageBlocks.length > 0) {
      console.log('📷 Media blocks:', imageBlocks.length);

      const roundedStatus = imageBlocks.map((b) => ({
        id: b.id,
        type: b.type,
        rounded: (b.settings as { rounded?: boolean }).rounded,
        roundedType: typeof (b.settings as { rounded?: boolean }).rounded,
      }));

      console.table(roundedStatus);
    }
  });
}

/**
 * Log validation results
 */
export function debugValidation(success: boolean, errors?: unknown) {
  if (!isDebugEnabled()) return;

  if (success) {
    debugLog('✅', 'Validation passed');
  } else {
    debugGroup('❌', 'Validation failed', () => {
      console.error('Errors:', errors);
    });
  }
}

/**
 * Initial debug banner
 */
export function debugInit() {
  if (!isDebugEnabled()) return;

  console.log(
    '%c🔍 Block Debug Mode Enabled',
    'background: #4F46E5; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log('💡 To disable: localStorage.removeItem("DEBUG_BLOCKS"); location.reload();');
  console.log('');
}
