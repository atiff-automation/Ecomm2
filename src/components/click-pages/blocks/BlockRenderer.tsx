'use client';

/**
 * Block Renderer - Renders blocks based on their type
 * Main entry point for rendering click page blocks with style transformation
 */

import { useMemo } from 'react';
import type { Block } from '@/types/click-page.types';
import type { ThemeSettings, StyleSettings } from '@/types/click-page-styles.types';
import {
  transformStyleSettings,
  cssPropertiesToString,
  generateResponsiveCSS,
  ANIMATION_KEYFRAMES,
} from '@/lib/utils/click-page-style-transformer';
import { useGoogleFonts, getThemeFonts } from '@/hooks/useGoogleFonts';
import { HeroBlockComponent } from './HeroBlock';
import { TextBlockComponent } from './TextBlock';
import { CTAButtonBlockComponent } from './CTAButtonBlock';
import { ImageBlockComponent } from './ImageBlock';
import { SpacerBlockComponent } from './SpacerBlock';
import { DividerBlockComponent } from './DividerBlock';
import { PricingTableBlockComponent } from './PricingTableBlock';
import { TestimonialBlockComponent } from './TestimonialBlock';
import { CountdownTimerBlockComponent } from './CountdownTimerBlock';
import { SocialProofBlockComponent } from './SocialProofBlock';
import { VideoBlockComponent } from './VideoBlock';
import { FormBlockComponent } from './FormBlock';
import { ImageGalleryBlockComponent } from './ImageGalleryBlock';
import { EmbedBlockComponent } from './EmbedBlock';
import { AccordionBlockComponent } from './AccordionBlock';

interface BlockRendererProps {
  blocks: Block[];
  themeSettings?: ThemeSettings;
  onBlockClick?: (blockId: string, blockType: string, targetUrl?: string) => void;
  clickPageSlug?: string;
}

/**
 * Renders a list of blocks with theme styling
 */
export function BlockRenderer({ blocks, themeSettings, onBlockClick, clickPageSlug }: BlockRendererProps) {
  // Sort blocks by sortOrder
  const sortedBlocks = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  // Load theme fonts
  const themeFonts = useMemo(() => {
    return themeSettings ? getThemeFonts(themeSettings) : [];
  }, [themeSettings]);
  useGoogleFonts(themeFonts);

  // Generate responsive CSS for all blocks
  const responsiveCSS = useMemo(() => {
    return sortedBlocks
      .map((block) => {
        const settings = (block as BlockWithStyles).settings;
        if (settings?.styles?.responsive) {
          return generateResponsiveCSS(block.id, settings.styles.responsive);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }, [sortedBlocks]);

  // Calculate container styles from theme
  const containerStyle = useMemo(() => {
    if (!themeSettings?.defaultSpacing) return {};
    return {
      gap: `${themeSettings.defaultSpacing.blockGap}px`,
      padding: `${themeSettings.defaultSpacing.containerPadding}px`,
    };
  }, [themeSettings]);

  // Generate CSS variables for theme colors
  const themeVars = useMemo(() => {
    if (!themeSettings?.colors) return {};
    return {
      '--theme-primary': themeSettings.colors.primary,
      '--theme-secondary': themeSettings.colors.secondary,
      '--theme-accent': themeSettings.colors.accent,
      '--theme-background': themeSettings.colors.background || '#FFFFFF',
      '--theme-text': themeSettings.colors.text || '#1F2937',
      '--theme-success': themeSettings.colors.success || '#10B981',
      '--theme-warning': themeSettings.colors.warning || '#F59E0B',
      '--theme-error': themeSettings.colors.error || '#EF4444',
      '--font-heading': themeSettings.fonts?.heading || 'Inter',
      '--font-body': themeSettings.fonts?.body || 'Inter',
    } as React.CSSProperties;
  }, [themeSettings]);

  return (
    <>
      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_KEYFRAMES }} />

      {/* Responsive CSS for blocks */}
      {responsiveCSS && (
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      )}

      <div
        className="click-page-blocks flex flex-col"
        style={{ ...containerStyle, ...themeVars }}
      >
        {sortedBlocks.map((block) => (
          <BlockItem
            key={block.id}
            block={block}
            themeSettings={themeSettings}
            onBlockClick={onBlockClick}
            clickPageSlug={clickPageSlug}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Extended block type with styles
 */
type BlockWithStyles = Block & {
  settings: {
    styles?: StyleSettings;
  };
};

interface BlockItemProps {
  block: Block;
  themeSettings?: ThemeSettings;
  onBlockClick?: (blockId: string, blockType: string, targetUrl?: string) => void;
  clickPageSlug?: string;
}

/**
 * Renders a single block with applied styles
 */
function BlockItem({ block, themeSettings, onBlockClick, clickPageSlug }: BlockItemProps) {
  const handleClick = (targetUrl?: string) => {
    onBlockClick?.(block.id, block.type, targetUrl);
  };

  // Transform block styles
  const blockStyles = useMemo(() => {
    const settings = (block as BlockWithStyles).settings;
    return transformStyleSettings(settings?.styles);
  }, [block]);

  // Generate inline styles
  const inlineStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {};

    // Apply transformed CSS properties
    Object.entries(blockStyles.css).forEach(([key, value]) => {
      (baseStyle as Record<string, string | number>)[key] = value;
    });

    // Apply animation if enabled
    Object.entries(blockStyles.animation).forEach(([key, value]) => {
      (baseStyle as Record<string, string | number>)[key] = value;
    });

    // Set default color if not specified (for inheritance to work properly)
    if (!baseStyle.color) {
      baseStyle.color = 'var(--theme-text, #1F2937)';
    }

    return baseStyle;
  }, [blockStyles]);

  // Generate hover class if needed
  const hoverStyle = useMemo(() => {
    if (Object.keys(blockStyles.hoverCss).length === 0) return '';
    return cssPropertiesToString(blockStyles.hoverCss);
  }, [blockStyles.hoverCss]);

  // Render block component
  const renderBlock = () => {
    switch (block.type) {
      case 'HERO':
        return <HeroBlockComponent block={block} onCtaClick={handleClick} />;
      case 'TEXT':
        return <TextBlockComponent block={block} />;
      case 'CTA_BUTTON':
        return <CTAButtonBlockComponent block={block} onClick={handleClick} />;
      case 'IMAGE':
        return <ImageBlockComponent block={block} onClick={handleClick} />;
      case 'SPACER':
        return <SpacerBlockComponent block={block} />;
      case 'DIVIDER':
        return <DividerBlockComponent block={block} />;
      case 'PRICING_TABLE':
        return <PricingTableBlockComponent block={block} onCtaClick={handleClick} />;
      case 'TESTIMONIAL':
        return <TestimonialBlockComponent block={block} />;
      case 'COUNTDOWN_TIMER':
        return <CountdownTimerBlockComponent block={block} onCtaClick={handleClick} />;
      case 'SOCIAL_PROOF':
        return <SocialProofBlockComponent block={block} />;
      case 'VIDEO':
        return <VideoBlockComponent block={block} />;
      case 'FORM':
        return <FormBlockComponent block={block} clickPageSlug={clickPageSlug} />;
      case 'IMAGE_GALLERY':
        return <ImageGalleryBlockComponent block={block} />;
      case 'EMBED':
        return <EmbedBlockComponent block={block} />;
      case 'ACCORDION':
        return <AccordionBlockComponent block={block} />;
      default:
        console.warn(`Unknown block type: ${(block as Block).type}`);
        return null;
    }
  };

  // Generate custom classes string
  const customClasses = blockStyles.customClasses.join(' ');

  return (
    <>
      {/* Hover styles for this block */}
      {hoverStyle && (
        <style dangerouslySetInnerHTML={{
          __html: `#block-${block.id}:hover { ${hoverStyle} }`
        }} />
      )}

      {/* Custom CSS for this block */}
      {blockStyles.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: blockStyles.customCSS }} />
      )}

      <div
        id={`block-${block.id}`}
        className={`click-page-block ${customClasses}`.trim()}
        style={inlineStyle}
      >
        {renderBlock()}
      </div>
    </>
  );
}

export default BlockRenderer;
