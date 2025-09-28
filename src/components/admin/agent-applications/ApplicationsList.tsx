/**
 * Applications List Component
 * Main listing page for admin to view all agent applications
 * Following CLAUDE.md principles: Centralized data management, systematic implementation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AgentApplicationStatus } from '@prisma/client';
import { AgentApplicationWithRelations, ApplicationFilters } from '@/types/agent-application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationStats } from './ApplicationStats';
import { ApplicationFilters as FiltersComponent } from './ApplicationFilters';
import { Loader2, Search, Filter, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ApplicationsListProps {
  initialData?: {
    applications: AgentApplicationWithRelations[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function ApplicationsList({ initialData }: ApplicationsListProps) {
  const [applications, setApplications] = useState<AgentApplicationWithRelations[]>(
    initialData?.applications || []
  );
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  );
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    limit: 10,
    status: undefined,
    search: '',
    hasJrmExp: undefined,
    dateFrom: undefined,
    dateTo: undefined
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch applications
  const fetchApplications = async (newFilters?: Partial<ApplicationFilters>) => {
    setLoading(true);
    try {
      const queryFilters = { ...filters, ...newFilters };
      const queryParams = new URLSearchParams();

      Object.entries(queryFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/agent-applications?${queryParams}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data permohonan');
      }

      const data = await response.json();
      setApplications(data.applications);
      setPagination(data.pagination);
      setFilters(queryFilters);

    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Gagal mengambil data permohonan');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    fetchApplications({ search: searchTerm, page: 1 });
  };

  // Handle status filter
  const handleStatusFilter = (status: AgentApplicationStatus | 'all') => {
    fetchApplications({
      status: status === 'all' ? undefined : status,
      page: 1
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchApplications({ page });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchApplications();
  };

  // Handle filter apply
  const handleFiltersApply = (newFilters: Partial<ApplicationFilters>) => {
    fetchApplications({ ...newFilters, page: 1 });
    setShowFilters(false);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/agent-applications/export?${queryParams}`);

      if (!response.ok) {
        throw new Error('Gagal mengeksport data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Data berjaya dieksport');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengeksport data');
    }
  };

  // Initial load
  useEffect(() => {
    if (!initialData) {
      fetchApplications();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permohonan Ejen</h1>
          <p className="text-gray-600">Urus semua permohonan ejen JRM</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <ApplicationStats />

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari nama, email, atau IC..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(filters.search || '')}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Dihantar</SelectItem>
                <SelectItem value="UNDER_REVIEW">Dalam Semakan</SelectItem>
                <SelectItem value="APPROVED">Diterima</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>

            {/* Search Button */}
            <Button onClick={() => handleSearch(filters.search || '')}>
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <FiltersComponent
          filters={filters}
          onApply={handleFiltersApply}
          onReset={() => {
            setFilters({
              page: 1,
              limit: 10,
              status: undefined,
              search: '',
              hasJrmExp: undefined,
              dateFrom: undefined,
              dateTo: undefined
            });
            fetchApplications({
              page: 1,
              limit: 10,
              status: undefined,
              search: '',
              hasJrmExp: undefined,
              dateFrom: undefined,
              dateTo: undefined
            });
          }}
        />
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Menunjukkan {applications.length} daripada {pagination.total} permohonan
        </span>
        <span>
          Halaman {pagination.page} daripada {pagination.totalPages}
        </span>
      </div>

      {/* Applications List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Memuat data permohonan...</p>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Tiada permohonan dijumpai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onStatusUpdate={() => fetchApplications()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}