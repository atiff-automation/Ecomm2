'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Landing Page Analytics Types
 */
interface Analytics {
  landingPage: {
    id: string;
    title: string;
    slug: string;
    status: string;
    publishedAt: string | null;
    createdAt: string;
  };
  summary: {
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    clickThroughRate: number;
    averageOrderValue: number;
  };
  clicksByType: Record<string, number>;
  utmPerformance: Record<string, { conversions: number; revenue: number }>;
  recentClicks: Array<{
    id: string;
    clickType: string;
    targetUrl: string | null;
    targetId: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    createdAt: string;
  }>;
  recentConversions: Array<{
    id: string;
    orderId: string;
    orderValue: number;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    createdAt: string;
  }>;
}

interface LandingPageAnalyticsProps {
  landingPageId: string;
}

/**
 * Landing Page Analytics Dashboard Component
 *
 * Displays comprehensive analytics for a landing page including:
 * - Summary metrics (views, clicks, conversions, revenue)
 * - Conversion funnel
 * - Click breakdown by type
 * - UTM performance
 * - Recent activity
 */
export default function LandingPageAnalytics({ landingPageId }: LandingPageAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/landing-pages/${landingPageId}/analytics`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [landingPageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">
            <p className="font-medium">Failed to load analytics</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, clicksByType, utmPerformance, recentConversions } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={summary.views.toLocaleString()}
          subtitle="Page visits"
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${summary.clickThroughRate}%`}
          subtitle={`${summary.clicks.toLocaleString()} clicks`}
        />
        <MetricCard
          title="Conversions"
          value={summary.conversions.toLocaleString()}
          subtitle={`${summary.conversionRate}% conversion rate`}
        />
        <MetricCard
          title="Total Revenue"
          value={`RM ${summary.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Avg: RM ${summary.averageOrderValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelStage
              label="Views"
              value={summary.views}
              percentage={100}
              color="bg-blue-500"
            />
            <FunnelStage
              label="Clicks"
              value={summary.clicks}
              percentage={summary.views > 0 ? (summary.clicks / summary.views) * 100 : 0}
              color="bg-green-500"
            />
            <FunnelStage
              label="Conversions"
              value={summary.conversions}
              percentage={summary.views > 0 ? (summary.conversions / summary.views) * 100 : 0}
              color="bg-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Click Breakdown */}
      {Object.keys(clicksByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Click Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(clicksByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                  <span className="text-sm text-muted-foreground">{count} clicks</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UTM Performance */}
      {Object.keys(utmPerformance).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>UTM Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Source</th>
                    <th className="text-right p-2">Conversions</th>
                    <th className="text-right p-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(utmPerformance).map(([source, data]) => (
                    <tr key={source} className="border-b">
                      <td className="p-2 font-medium capitalize">{source}</td>
                      <td className="p-2 text-right">{data.conversions}</td>
                      <td className="p-2 text-right">
                        RM {data.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Conversions */}
      {recentConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-right p-2">Value</th>
                    <th className="text-right p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConversions.slice(0, 10).map((conversion) => (
                    <tr key={conversion.id} className="border-b">
                      <td className="p-2 font-mono text-xs">{conversion.orderId.substring(0, 8)}...</td>
                      <td className="p-2">{conversion.utmSource || 'direct'}</td>
                      <td className="p-2 text-right">
                        RM {conversion.orderValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {new Date(conversion.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Funnel Stage Component
 */
function FunnelStage({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-8 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
