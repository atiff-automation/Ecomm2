/**
 * PageHeader Component - Reusable page header for member panel
 * Following @CLAUDE.md principles - reusable, type-safe, DRY
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PageHeaderProps } from '@/types/member';
import { ICON_SIZES, LAYOUT_CONSTANTS } from '@/lib/constants/layout';
import { THEME_CONSTANTS } from '@/lib/constants/theme';

export function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  additionalInfo,
}: PageHeaderProps) {
  return (
    <div className={LAYOUT_CONSTANTS.HEADER.MARGIN_BOTTOM}>
      {/* Title with Icon */}
      <h1
        className={`text-3xl font-bold flex items-center ${LAYOUT_CONSTANTS.HEADER.TITLE_SPACING}`}
      >
        <Icon className={ICON_SIZES.LARGE} />
        {title}
      </h1>

      {/* Description */}
      <p
        className={`text-gray-600 ${LAYOUT_CONSTANTS.HEADER.DESCRIPTION_MARGIN}`}
      >
        {description}
      </p>

      {/* Badge and Additional Info */}
      {(badge || additionalInfo) && (
        <div
          className={`flex items-center gap-2 ${LAYOUT_CONSTANTS.HEADER.DESCRIPTION_MARGIN}`}
        >
          {badge && (
            <Badge
              className={
                badge.variant === 'member'
                  ? THEME_CONSTANTS.BADGES.MEMBER
                  : badge.variant === 'regular'
                    ? THEME_CONSTANTS.BADGES.REGULAR
                    : badge.className || ''
              }
              variant={
                badge.variant === 'member' || badge.variant === 'custom'
                  ? 'default'
                  : 'outline'
              }
            >
              {badge.text}
            </Badge>
          )}
          {additionalInfo && (
            <span className="text-sm text-gray-600">{additionalInfo}</span>
          )}
        </div>
      )}
    </div>
  );
}
