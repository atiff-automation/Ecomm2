/**
 * StatsSummaryCard Component - Compact stats display for member panel
 * Following @CLAUDE.md principles - reusable, type-safe, DRY
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsSummaryCardProps } from '@/types/member';
import { GRID_CONFIGS, LAYOUT_CONSTANTS } from '@/lib/constants/layout';
import { THEME_CONSTANTS } from '@/lib/constants/theme';
import { MEMBER_PAGE_TEXT } from '@/lib/constants/member-text';

export function StatsSummaryCard({
  stats,
  title = MEMBER_PAGE_TEXT.SECTIONS.SUMMARY.TITLE,
}: StatsSummaryCardProps) {
  return (
    <Card className={`${THEME_CONSTANTS.MEMBER_SUMMARY.BACKGROUND} ${THEME_CONSTANTS.MEMBER_SUMMARY.BORDER}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${GRID_CONFIGS.STATS_COMPACT} ${LAYOUT_CONSTANTS.MEMBER.GAP}`}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              {stat.icon && <stat.icon className="w-5 h-5 mx-auto mb-1 text-gray-500" />}
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p
                className={`text-2xl font-bold ${stat.valueColor || 'text-gray-900'}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
