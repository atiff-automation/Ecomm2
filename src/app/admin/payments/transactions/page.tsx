'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import {
  AdminPageLayout,
  TabConfig,
  BreadcrumbItem,
} from '@/components/admin/layout';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentId: string | null;
  toyyibpayBillCode: string | null;
  createdAt: string;
}

interface TransactionFilters {
  paymentStatus?: string;
  search?: string;
}

export default function PaymentTransactionsPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (
    !session ||
    !['ADMIN', 'SUPERADMIN', 'STAFF'].includes(session.user?.role || '')
  ) {
    redirect('/auth/signin');
  }

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      const response = await fetch(
        `/api/admin/payments/transactions?${queryParams}`
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        }));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      window.open(
        `/api/admin/payments/transactions/export?${queryParams}`,
        '_blank'
      );
    } catch (error) {
      console.error('Failed to export transactions:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define contextual tabs
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Payment Overview', href: '/admin/payments' },
    {
      id: 'transactions',
      label: 'Transactions',
      href: '/admin/payments/transactions',
    },
    {
      id: 'gateway-config',
      label: 'Gateway Config',
      href: '/admin/payments/toyyibpay',
    },
  ];

  // Define breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payments', href: '/admin/payments', icon: Smartphone },
    { label: 'Transactions', href: '/admin/payments/transactions' },
  ];

  // Page actions
  const pageActions = (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button onClick={fetchTransactions}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );

  // Filters component
  const filtersComponent = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by order number, customer name, or email..."
          value={filters.search || ''}
          onChange={e =>
            setFilters(prev => ({ ...prev, search: e.target.value }))
          }
          className="pl-10"
        />
      </div>
      <Select
        value={filters.paymentStatus || ''}
        onValueChange={value =>
          setFilters(prev => ({
            ...prev,
            paymentStatus: value === 'all' ? '' : value,
          }))
        }
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AdminPageLayout
      title="Payment Transactions"
      subtitle="View and manage payment transactions"
      actions={pageActions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      filters={filtersComponent}
      loading={loading}
      parentSection={{ label: 'Payments', href: '/admin/payments' }}
      showBackButton={true}
    >
      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Order
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Payment Method
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium">
                            {transaction.orderNumber}
                          </div>
                          {transaction.toyyibpayBillCode && (
                            <div className="text-xs text-muted-foreground">
                              Bill: {transaction.toyyibpayBillCode}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">
                            {transaction.customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.customerEmail}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {transaction.paymentMethod || 'N/A'}
                          </div>
                          {transaction.paymentId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {transaction.paymentId}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={getPaymentStatusColor(
                              transaction.paymentStatus
                            )}
                          >
                            {transaction.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/orders/${transaction.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
