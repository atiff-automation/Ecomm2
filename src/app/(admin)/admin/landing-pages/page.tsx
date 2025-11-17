/**
 * Admin Landing Page List Page
 * /admin/landing-pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Landing PageWithRelations, Landing PageCategory } from '@/types/landing page.types';
import { format } from 'date-fns';
import { LANDING_PAGE_CONSTANTS } from '@/lib/constants/landing page-constants';

export default function AdminLanding PageListPage() {
  const router = useRouter();

  // State
  const [landing pages, setLanding Pages] = useState<Landing PageWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Landing PageCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/landing page-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch landing pages
  useEffect(() => {
    fetchLanding Pages();
  }, [categoryFilter, statusFilter, page]);

  const fetchLanding Pages = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('pageSize', LANDING_PAGE_CONSTANTS.UI.LANDING_PAGES_PER_PAGE.toString());

      const response = await fetch(`/api/admin/landing-pages?${params}`);

      if (!response.ok) throw new Error('Failed to fetch landing pages');

      const data = await response.json();
      setLanding Pages(data.landing pages);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
      toast.error('Failed to fetch landing pages');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchLanding Pages();
  };

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetchWithCSRF(`/api/admin/landing-pages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete landing page');

      toast.success('Landing Page deleted successfully');
      fetchLanding Pages();
    } catch (error) {
      console.error('Error deleting landing page:', error);
      toast.error('Failed to delete landing page');
    }
  };

  // Filter landing pages by search (client-side for better UX)
  const filteredLanding Pages = landing pages.filter(landing page =>
    search
      ? landing page.title.toLowerCase().includes(search.toLowerCase()) ||
        (landing page.excerpt && landing page.excerpt.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Landing Page Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage landing pages for your website
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/content/landing page-categories" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <FolderOpen className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Manage Categories</span>
                <span className="md:hidden">Categories</span>
              </Button>
            </Link>
            <Link href="/admin/landing-pages/create" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Create New Landing Page</span>
                <span className="md:hidden">Create Landing Page</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search landing pages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Landing Page List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredLanding Pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No landing pages found</p>
            <Link href="/admin/landing-pages/create" className="mt-4 inline-block">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Landing Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">
                Landing Pages ({filteredLanding Pages.length})
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Manage and organize your published landing pages
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 text-xs md:text-sm font-medium">Title</th>
                      <th className="text-left p-3 text-xs md:text-sm font-medium hidden md:table-cell">Category</th>
                      <th className="text-center p-3 text-xs md:text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-xs md:text-sm font-medium hidden lg:table-cell">Author</th>
                      <th className="text-left p-3 text-xs md:text-sm font-medium hidden lg:table-cell">Published</th>
                      <th className="text-center p-3 text-xs md:text-sm font-medium hidden sm:table-cell">Views</th>
                      <th className="text-center p-3 text-xs md:text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLanding Pages.map((landing page) => (
                      <tr key={landing page.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs">
                              {landing page.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs md:hidden">
                              {landing page.category.name}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: landing page.category.color || '#3B82F6',
                              color: landing page.category.color || '#3B82F6',
                            }}
                          >
                            {landing page.category.name}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {landing page.status === 'PUBLISHED' ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-sm">
                          {landing page.author.firstName} {landing page.author.lastName}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-sm text-muted-foreground">
                          {landing page.publishedAt
                            ? format(new Date(landing page.publishedAt), 'MMM d, yyyy')
                            : '-'}
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{landing page.viewCount}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/admin/landing-pages/${landing page.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(landing page.id, landing page.title)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
