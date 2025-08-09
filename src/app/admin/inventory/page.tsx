'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContextualNavigation from '@/components/admin/ContextualNavigation';
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
  Filter,
  Download,
  Upload,
  Eye,
  Package,
  AlertTriangle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  memberPrice: number | null;
  category: {
    id: string;
    name: string;
  } | null;
  status: string;
  lowStockThreshold: number;
  createdAt: string;
}

interface InventoryFilters {
  category?: string;
  status?: string;
  stockLevel?: string;
  search?: string;
}

export default function AdminInventory() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InventoryFilters>({
    stockLevel: searchParams.get('filter') || '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      const response = await fetch(`/api/admin/inventory?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        // Ensure we set an array - handle both direct array and object with categories property
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]); // Ensure we always have an array
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        export: 'true',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        ),
      });

      const response = await fetch(
        `/api/admin/inventory/export?${queryParams}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export inventory:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stock === 0) {
      return 'bg-red-100 text-red-800';
    } else if (product.stock <= product.lowStockThreshold) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (product: Product) => {
    if (product.stock === 0) {
      return 'Out of Stock';
    } else if (product.stock <= product.lowStockThreshold) {
      return 'Low Stock';
    }
    return 'In Stock';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const breadcrumbItems = [
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: Package,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage product stock levels
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin/products/import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Products
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/products/create">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {
                  products.filter(
                    p => p.stock <= p.lowStockThreshold && p.stock > 0
                  ).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => p.stock === 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Search products..."
                  value={filters.search || ''}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
              <Select
                value={filters.category || ''}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    category: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(categories) &&
                    categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status || ''}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.stockLevel || ''}
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    stockLevel: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stock Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between mt-4">
              <Button onClick={fetchProducts} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Inventory
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({pagination.total})</CardTitle>
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
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Product</th>
                        <th className="text-left py-3">SKU</th>
                        <th className="text-left py-3">Category</th>
                        <th className="text-left py-3">Stock</th>
                        <th className="text-left py-3">Price</th>
                        <th className="text-left py-3">Member Price</th>
                        <th className="text-left py-3">Status</th>
                        <th className="text-left py-3">Stock Status</th>
                        <th className="text-left py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr
                          key={product.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3">
                            <div className="font-medium">{product.name}</div>
                          </td>
                          <td className="py-3 font-mono text-sm">
                            {product.sku}
                          </td>
                          <td className="py-3">
                            {product.category ? (
                              <Badge variant="outline">
                                {product.category.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">No category</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {product.stock}
                              </span>
                              {product.stock <= product.lowStockThreshold &&
                                product.stock > 0 && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                              {product.stock === 0 && (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-3">
                            {product.memberPrice ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(product.memberPrice)}
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge className={getStockStatusColor(product)}>
                              {getStockStatusText(product)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/products/${product.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {products.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found matching your criteria
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} products
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPagination(prev => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={pagination.page <= 1}
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
                            page: prev.page + 1,
                          }))
                        }
                        disabled={pagination.page >= pagination.totalPages}
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
      </div>
    </div>
  );
}
