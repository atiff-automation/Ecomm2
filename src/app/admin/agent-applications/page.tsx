'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Eye,
  UserPlus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { AdminPageLayout } from '@/components/admin/layout';

interface AgentApplication {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  hasBusinessExp: boolean;
  hasJrmExp: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface FilterState {
  search: string;
  status: string;
  hasJrmExp: string;
  dateFrom: string;
  dateTo: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  DRAFT: Clock,
  SUBMITTED: AlertCircle,
  UNDER_REVIEW: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
};

export default function AgentApplicationsPage() {
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    hasJrmExp: '',
    dateFrom: '',
    dateTo: '',
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status &&
          filters.status !== 'all' && { status: filters.status }),
        ...(filters.hasJrmExp &&
          filters.hasJrmExp !== 'all' && { hasJrmExp: filters.hasJrmExp }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/admin/agent-applications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getStatusIcon = (status: AgentApplication['status']) => {
    const Icon = statusIcons[status];
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '-';
    }
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminPageLayout
      title="Agent Applications"
      subtitle="Manage and review agent applications"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={value => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.hasJrmExp}
                onValueChange={value => handleFilterChange('hasJrmExp', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="JRM Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Has JRM Experience</SelectItem>
                  <SelectItem value="false">No JRM Experience</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
                placeholder="From Date"
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
                placeholder="To Date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Agent Applications ({pagination.total})
              </CardTitle>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map(application => (
                        <tr key={application.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {application.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.phoneNumber}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={`flex items-center gap-1 ${statusColors[application.status]}`}
                            >
                              {getStatusIcon(application.status)}
                              {application.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <Badge
                                variant={
                                  application.hasBusinessExp
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {application.hasBusinessExp
                                  ? 'Business'
                                  : 'No Business'}
                              </Badge>
                              <Badge
                                variant={
                                  application.hasJrmExp
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {application.hasJrmExp ? 'JRM' : 'No JRM'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(application.submittedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/agent-applications/${application.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-6">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
