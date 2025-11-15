/**
 * MemberBenefitsCard Component - Display member benefits and savings
 * Following @CLAUDE.md principles - reusable, type-safe, DRY
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Gift } from 'lucide-react';
import { MemberBenefitsCardProps } from '@/types/member';
import { ICON_SIZES, GRID_CONFIGS } from '@/lib/constants/layout';
import { SAVINGS_THEME } from '@/lib/constants/theme';
import { MEMBER_PAGE_TEXT } from '@/lib/constants/member-text';

export function MemberBenefitsCard({
  benefits,
  memberStats,
  formatPrice,
}: MemberBenefitsCardProps) {
  return (
    <div className={GRID_CONFIGS.BENEFITS_GRID + ' gap-6'}>
      {/* Benefits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className={ICON_SIZES.REGULAR} />
            {MEMBER_PAGE_TEXT.SECTIONS.BENEFITS.TITLE}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg ${benefit.backgroundColor}`}
            >
              <div>
                <p className={`font-semibold ${benefit.textColor}`}>
                  {benefit.title}
                </p>
                <p className={`text-sm ${benefit.descriptionColor}`}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Savings Summary */}
      {memberStats && (
        <Card>
          <CardHeader>
            <CardTitle>{MEMBER_PAGE_TEXT.SAVINGS_SUMMARY.TITLE}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Savings Highlight */}
              <div className={`text-center p-6 rounded-lg ${SAVINGS_THEME.GRADIENT}`}>
                <p className={`text-sm mb-2 ${SAVINGS_THEME.LABEL_COLOR}`}>
                  {MEMBER_PAGE_TEXT.SAVINGS_SUMMARY.TOTAL_SAVINGS_LABEL}
                </p>
                <p className={`text-4xl font-bold ${SAVINGS_THEME.AMOUNT_COLOR}`}>
                  {formatPrice(memberStats.totalSavings)}
                </p>
              </div>

              <Separator />

              {/* Stats Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={SAVINGS_THEME.LABEL_COLOR}>
                    {MEMBER_PAGE_TEXT.STATS.TOTAL_ORDERS}
                  </span>
                  <span className="font-semibold">{memberStats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className={SAVINGS_THEME.LABEL_COLOR}>
                    {MEMBER_PAGE_TEXT.STATS.TOTAL_SPENT}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(memberStats.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={SAVINGS_THEME.LABEL_COLOR}>
                    {MEMBER_PAGE_TEXT.STATS.AVG_ORDER}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(memberStats.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={SAVINGS_THEME.LABEL_COLOR}>
                    {MEMBER_PAGE_TEXT.STATS.FAVORITE_CATEGORY}
                  </span>
                  <span className="font-semibold">
                    {memberStats.favoriteCategory || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
