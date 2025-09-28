/**
 * Application Stats Component
 * Dashboard statistics for agent applications
 * Following CLAUDE.md principles: Data-driven widgets, systematic implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface ApplicationStatsData {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export function ApplicationStats() {
  const [stats, setStats] = useState<ApplicationStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/agent-applications/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Jumlah Permohonan',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Menunggu Semakan',
      value: stats.submitted + stats.underReview,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      badge: stats.submitted + stats.underReview > 0 ? 'Perlu Tindakan' : null,
      badgeColor: 'bg-yellow-200 text-yellow-800'
    },
    {
      title: 'Diluluskan',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Ditolak',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const getGrowthIcon = () => {
    if (stats.growth > 0) return TrendingUp;
    if (stats.growth < 0) return TrendingDown;
    return Minus;
  };

  const getGrowthColor = () => {
    if (stats.growth > 0) return 'text-green-600';
    if (stats.growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const GrowthIcon = getGrowthIcon();

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.badge && (
                      <Badge className={`mt-2 text-xs ${stat.badgeColor}`}>
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Growth and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pertumbuhan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Bulan lepas: {stats.lastMonth}
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${getGrowthColor()}`}>
                  <GrowthIcon className="w-5 h-5" />
                  <span className="font-semibold">
                    {stats.growth > 0 ? '+' : ''}{stats.growth.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.growth > 0 ? 'Meningkat' : stats.growth < 0 ? 'Menurun' : 'Sama'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pecahan Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Draft</span>
                </div>
                <Badge variant="outline">{stats.draft}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Dihantar</span>
                </div>
                <Badge variant="outline">{stats.submitted}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Dalam Semakan</span>
                </div>
                <Badge variant="outline">{stats.underReview}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Diluluskan</span>
                </div>
                <Badge variant="outline">{stats.approved}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Ditolak</span>
                </div>
                <Badge variant="outline">{stats.rejected}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      {(stats.submitted + stats.underReview > 5) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Perhatian Diperlukan</p>
                <p>
                  Terdapat {stats.submitted + stats.underReview} permohonan yang menunggu untuk disemak.
                  Sila semak dan kemaskini status secepat mungkin untuk memastikan pengalaman yang baik untuk pemohon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}