/**
 * Admin Article Category Management Page
 * /admin/content/article-categories
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
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
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ArticleCategoryWithCount } from '@/types/article.types';
import { DragDropTable } from '@/components/admin/DragDropTable';
import { prepareReorderPayload } from '@/lib/utils/drag-drop-utils';

export default function AdminArticleCategoryListPage() {
  const router = useRouter();

  // State
  const [categories, setCategories] = useState<ArticleCategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('isActive', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/article-categories?${params}`);

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string, articleCount: number) => {
    if (articleCount > 0) {
      toast.error(`Cannot delete category with ${articleCount} article(s). Please reassign or delete the articles first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetchWithCSRF(`/api/admin/article-categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  // Handle reorder
  const handleReorder = async (reorderedCategories: ArticleCategoryWithCount[]) => {
    try {
      const payload = prepareReorderPayload(reorderedCategories);

      const response = await fetchWithCSRF('/api/admin/article-categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }

      // Update local state with new order
      setCategories(reorderedCategories);
      toast.success('Categories reordered successfully');
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
      throw error; // Re-throw for DragDropTable to handle rollback
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter((cat) =>
    search
      ? cat.name.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="mb-6 md:mb-8">
        <Link href="/admin/content/articles">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Article Category Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage article categories - create, edit, and organize categories
            </p>
          </div>
          <Link href="/admin/content/article-categories/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Create New Category</span>
              <span className="md:hidden">Create Category</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ALL')}
                size="sm"
                className="flex-1 md:flex-initial"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'true' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('true')}
                size="sm"
                className="flex-1 md:flex-initial"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'false' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('false')}
                size="sm"
                className="flex-1 md:flex-initial"
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No categories found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Categories ({filteredCategories.length})</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Categories are used to organize articles on the public page
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {/* Table Header */}
            <div className="flex items-center gap-2 md:gap-4 py-3 px-2 md:px-4 border-b bg-muted/50 font-medium text-xs md:text-sm text-muted-foreground">
              <div className="w-8"></div> {/* Space for drag handle */}
              <div className="flex-1 min-w-0">Category</div>
              <div className="hidden lg:block flex-1 min-w-0">Description</div>
              <div className="flex items-center justify-center w-16">Articles</div>
              <div className="flex items-center justify-center w-20 md:w-24">Status</div>
              <div className="w-[72px] md:w-[88px] text-center">Actions</div>
            </div>

            <DragDropTable
              items={filteredCategories}
              onReorder={handleReorder}
              renderItem={(category) => (
                <div className="flex items-center gap-2 md:gap-4 py-3 md:py-4 px-2 md:px-4 border-b last:border-b-0">
                  {/* Category Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base truncate">
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate lg:hidden">
                      {category.description || 'No description'}
                    </p>
                  </div>

                  {/* Description - Hidden on mobile */}
                  <div className="hidden lg:block flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description || '-'}
                    </p>
                  </div>

                  {/* Article Count */}
                  <div className="flex items-center justify-center w-16">
                    <Badge variant="secondary" className="text-xs">
                      {category._count.articles}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center w-20 md:w-24">
                    {category.isActive ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Active</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Inactive</span>
                        <span className="sm:hidden">✕</span>
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 md:gap-2">
                    <Link href={`/admin/content/article-categories/${category.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(
                          category.id,
                          category.name,
                          category._count.articles
                        )
                      }
                      disabled={category._count.articles > 0}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
