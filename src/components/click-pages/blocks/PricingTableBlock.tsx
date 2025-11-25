'use client';

/**
 * Pricing Table Block Component
 * Product pricing with tiers
 * Inherits color from parent wrapper for style customization
 */

import type { PricingTableBlock, PricingTier } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface PricingTableBlockComponentProps {
  block: PricingTableBlock;
  onCtaClick?: (targetUrl?: string) => void;
}

export function PricingTableBlockComponent({ block, onCtaClick }: PricingTableBlockComponentProps) {
  const { settings } = block;

  // Note: Padding/margin are applied by BlockRenderer wrapper via settings.styles.spacing
  return (
    <div style={{ color: 'inherit' }}>
      <div
        className={cn(
          'gap-6',
          getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.PRICING_TABLE),
          settings.layout === 'horizontal'
            ? 'flex flex-col md:flex-row justify-center'
            : 'grid grid-cols-1',
          settings.tiers.length === 1 && 'max-w-md',
          settings.tiers.length === 2 && 'max-w-3xl md:grid-cols-2',
          settings.tiers.length >= 3 && 'lg:grid-cols-3'
        )}
      >
        {settings.tiers.map((tier) => (
          <PricingTierCard
            key={tier.id}
            tier={tier}
            onCtaClick={onCtaClick}
          />
        ))}
      </div>
    </div>
  );
}

interface PricingTierCardProps {
  tier: PricingTier;
  onCtaClick?: (targetUrl?: string) => void;
}

function PricingTierCard({ tier, onCtaClick }: PricingTierCardProps) {
  const handleClick = () => {
    if (tier.ctaUrl) {
      onCtaClick?.(tier.ctaUrl);
      window.open(tier.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 flex flex-col bg-white/90 backdrop-blur-sm',
        tier.highlighted
          ? 'ring-2 ring-current shadow-lg scale-105'
          : 'border border-gray-200'
      )}
      style={{ color: 'inherit' }}
    >
      {tier.badge && (
        <div
          className="text-center text-sm font-semibold py-1 px-3 rounded-full mb-4 self-center text-white"
          style={{ backgroundColor: 'currentColor' }}
        >
          <span className="text-white mix-blend-difference">{tier.badge}</span>
        </div>
      )}

      {tier.imageUrl && (
        <div className="flex justify-center mb-4">
          <img
            src={tier.imageUrl}
            alt={tier.title}
            className="w-40 h-40 object-contain rounded-lg"
          />
        </div>
      )}

      <h3 className="text-xl font-bold text-center mb-3" style={{ color: 'inherit' }}>{tier.title}</h3>

      {tier.subtitle && (
        <p className="text-center text-sm mb-5 opacity-70" style={{ color: 'inherit' }}>{tier.subtitle}</p>
      )}

      <div className="text-center mb-6">
        {tier.originalPrice && tier.originalPrice > tier.price && (
          <span className="line-through text-lg mr-2 opacity-50" style={{ color: 'inherit' }}>
            RM{tier.originalPrice}
          </span>
        )}
        <span className="text-4xl font-bold" style={{ color: 'inherit' }}>RM{tier.price}</span>
      </div>

      {tier.features.length > 0 && (
        <ul className="space-y-3 mb-6 flex-grow">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="opacity-80" style={{ color: 'inherit' }}>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleClick}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:opacity-90',
          tier.highlighted
            ? 'bg-current text-white'
            : 'bg-gray-100 hover:bg-gray-200'
        )}
        style={tier.highlighted ? { backgroundColor: 'currentColor' } : { color: 'inherit' }}
      >
        <span className={tier.highlighted ? 'text-white mix-blend-difference' : ''}>{tier.ctaText}</span>
      </button>
    </div>
  );
}

export default PricingTableBlockComponent;
