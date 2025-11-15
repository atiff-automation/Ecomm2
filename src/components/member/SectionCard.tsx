/**
 * SectionCard Component - Reusable card wrapper for member panel sections
 * Following @CLAUDE.md principles - reusable, type-safe, DRY
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionCardProps } from '@/types/member';
import { ICON_SIZES } from '@/lib/constants/layout';

export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  headerAction,
  className,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader
        className={headerAction ? 'flex flex-row items-center justify-between' : ''}
      >
        <CardTitle className="flex items-center gap-2">
          <Icon className={ICON_SIZES.REGULAR} />
          {title}
        </CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
